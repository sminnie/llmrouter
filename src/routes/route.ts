import type { FastifyPluginAsync } from "fastify";
import type { MetricsStore } from "../metrics.js";
import type { ChatMessage, ProviderAdapter } from "../providers/types.js";
import { getProvider } from "../providers/index.js";
import { classify } from "../router/classifier.js";
import { decideTier, normalizeStrategy } from "../router/strategy.js";
import { modelsFor } from "../pricing.js";
import { computeSavings } from "../savings.js";

interface RouteBody {
  prompt?: string;
  messages?: ChatMessage[];
  system?: string;
}

export interface RoutePluginOptions {
  store: MetricsStore;
  provider?: ProviderAdapter;
}

export const routePlugin: FastifyPluginAsync<RoutePluginOptions> = async (
  app,
  opts,
) => {
  const { store } = opts;
  const provider = opts.provider ?? getProvider();
  const models = modelsFor(provider.name);

  app.post<{ Body: RouteBody }>("/route", async (req, reply) => {
    const body = req.body ?? {};

    const messages: ChatMessage[] = [];
    if (body.system) messages.push({ role: "system", content: body.system });
    if (body.messages?.length) {
      messages.push(...body.messages);
    } else if (body.prompt) {
      messages.push({ role: "user", content: body.prompt });
    }

    if (messages.filter((m) => m.role !== "system").length === 0) {
      reply.code(400);
      return { error: "Provide either `prompt` or a non-empty `messages` array." };
    }

    const userText = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join("\n");

    const strategy = normalizeStrategy(req.headers["x-strategy"]);
    const classification = classify(userText);
    const tier = decideTier(classification.score, strategy);
    const chosenModel = models[tier];

    const result = await provider.chat(chosenModel, messages);

    const { baselineUsd, actualUsd, savingsUsd } = computeSavings({
      frontierModel: models.frontier,
      chosenModel,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    });

    store.record({
      ts: new Date().toISOString(),
      model_selected: chosenModel,
      tier,
      strategy,
      complexity: classification.score,
      tokens_in: result.tokensIn,
      tokens_out: result.tokensOut,
      baseline_usd: baselineUsd,
      savings_usd: savingsUsd,
    });

    reply.header("X-Savings-USD", savingsUsd.toFixed(6));
    reply.header("X-Model-Selected", chosenModel);
    reply.header("X-Complexity-Score", classification.score.toFixed(3));
    reply.header("X-Strategy", strategy);
    reply.header("X-Tier", tier);

    return {
      model: chosenModel,
      tier,
      strategy,
      provider: provider.name,
      complexity: classification.score,
      matched: {
        simple: classification.matchedSimple,
        complex: classification.matchedComplex,
      },
      usage: { tokens_in: result.tokensIn, tokens_out: result.tokensOut },
      cost: {
        baseline_usd: baselineUsd,
        actual_usd: actualUsd,
        savings_usd: savingsUsd,
      },
      response: result.content,
    };
  });
};

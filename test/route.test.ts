import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import { routePlugin } from "../src/routes/route.js";
import { metricsPlugin } from "../src/routes/metrics.js";
import { InMemoryMetricsStore } from "../src/metrics.js";
import type { ChatMessage, ChatResult, ProviderAdapter } from "../src/providers/types.js";

class MockProvider implements ProviderAdapter {
  readonly name = "openai"; // reuse openai pricing/tiers for deterministic assertions
  async chat(model: string, messages: ChatMessage[]): Promise<ChatResult> {
    return {
      content: `mock reply from ${model}`,
      tokensIn: 500,
      tokensOut: 500,
      model,
    };
  }
}

function buildTestApp() {
  const app = Fastify();
  const store = new InMemoryMetricsStore();
  app.register(routePlugin, { store, provider: new MockProvider() });
  app.register(metricsPlugin, { store });
  return { app, store };
}

describe("POST /route (integration)", () => {
  it("routes a simple prompt to the cheap model with positive savings", async () => {
    const { app } = buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/route",
      headers: { "x-strategy": "cost-optimized" },
      payload: { prompt: "Classify this review as positive or negative: Loved it!" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-tier"]).toBe("cheap");
    expect(res.headers["x-model-selected"]).toBe("gpt-4o-mini");
    expect(Number(res.headers["x-savings-usd"])).toBeGreaterThan(0);
    const body = res.json();
    expect(body.cost.savings_usd).toBeGreaterThan(0);
  });

  it("routes a complex prompt to the frontier model with ~zero savings", async () => {
    const { app } = buildTestApp();
    const res = await app.inject({
      method: "POST",
      url: "/route",
      payload: {
        prompt:
          "Analyze this codebase step by step, debug the deadlock, refactor it, and explain why it happens.",
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-tier"]).toBe("frontier");
    expect(res.headers["x-model-selected"]).toBe("gpt-4o");
    expect(Number(res.headers["x-savings-usd"])).toBe(0);
  });

  it("rejects requests with no prompt or messages", async () => {
    const { app } = buildTestApp();
    const res = await app.inject({ method: "POST", url: "/route", payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it("accumulates savings in /metrics", async () => {
    const { app } = buildTestApp();
    await app.inject({
      method: "POST",
      url: "/route",
      headers: { "x-strategy": "cost-optimized" },
      payload: { prompt: "Translate to French: good morning" },
    });
    const res = await app.inject({ method: "GET", url: "/metrics" });
    const body = res.json();
    expect(body.summary.total_requests).toBe(1);
    expect(body.summary.total_savings_usd).toBeGreaterThan(0);
    expect(body.recent).toHaveLength(1);
  });
});

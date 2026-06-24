import type { ChatMessage, ChatResult, ProviderAdapter } from "./types.js";
import { estimateTokens } from "../router/classifier.js";

export class OllamaProvider implements ProviderAdapter {
  readonly name = "ollama";
  private baseUrl: string;

  constructor(baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async chat(model: string, messages: ChatMessage[]): Promise<ChatResult> {
    const numPredict = Number(process.env.MAX_TOKENS ?? 256);
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: { num_predict: numPredict },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const content = data.message?.content ?? "";
    const promptText = messages.map((m) => m.content).join("\n");
    return {
      content,
      tokensIn: data.prompt_eval_count ?? estimateTokens(promptText),
      tokensOut: data.eval_count ?? estimateTokens(content),
      model,
    };
  }
}

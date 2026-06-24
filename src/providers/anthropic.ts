import type { ChatMessage, ChatResult, ProviderAdapter } from "./types.js";
import { estimateTokens } from "../router/classifier.js";

export class AnthropicProvider implements ProviderAdapter {
  readonly name = "anthropic";
  private apiKey: string;
  private baseUrl: string;

  constructor(
    apiKey = process.env.ANTHROPIC_API_KEY ?? "",
    baseUrl = "https://api.anthropic.com/v1",
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chat(model: string, messages: ChatMessage[]): Promise<ChatResult> {
    if (!this.apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set (PROVIDER=anthropic requires it)",
      );
    }

    // Anthropic takes the system prompt as a top-level field, not a message.
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n");
    const turns = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        ...(system ? { system } : {}),
        messages: turns,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      content?: { text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const content = data.content?.map((c) => c.text ?? "").join("") ?? "";
    const promptText = messages.map((m) => m.content).join("\n");
    return {
      content,
      tokensIn: data.usage?.input_tokens ?? estimateTokens(promptText),
      tokensOut: data.usage?.output_tokens ?? estimateTokens(content),
      model,
    };
  }
}

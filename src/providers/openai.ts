import type { ChatMessage, ChatResult, ProviderAdapter } from "./types.js";
import { estimateTokens } from "../router/classifier.js";

export class OpenAIProvider implements ProviderAdapter {
  readonly name = "openai";
  private apiKey: string;
  private baseUrl: string;

  constructor(
    apiKey = process.env.OPENAI_API_KEY ?? "",
    baseUrl = "https://api.openai.com/v1",
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async chat(model: string, messages: ChatMessage[]): Promise<ChatResult> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not set (PROVIDER=openai requires it)");
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${body}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    const promptText = messages.map((m) => m.content).join("\n");
    return {
      content,
      tokensIn: data.usage?.prompt_tokens ?? estimateTokens(promptText),
      tokensOut: data.usage?.completion_tokens ?? estimateTokens(content),
      model,
    };
  }
}

import type { ProviderAdapter } from "./types.js";
import { OllamaProvider } from "./ollama.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { MockProvider } from "./mock.js";

export function getProvider(name = process.env.PROVIDER ?? "ollama"): ProviderAdapter {
  switch (name) {
    case "ollama":
      return new OllamaProvider();
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "mock":
      return new MockProvider();
    default:
      throw new Error(`Unknown PROVIDER "${name}"`);
  }
}

export type { ProviderAdapter, ChatMessage, ChatResult } from "./types.js";

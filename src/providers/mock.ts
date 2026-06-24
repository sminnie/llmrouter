import type { ChatMessage, ChatResult, ProviderAdapter } from "./types.js";
import { estimateTokens } from "../router/classifier.js";

/** Zero-dependency fake provider for local testing/demos without any model. */
export class MockProvider implements ProviderAdapter {
  readonly name = "ollama"; // reuse ollama tiers/pricing for realistic savings
  async chat(model: string, messages: ChatMessage[]): Promise<ChatResult> {
    const promptText = messages.map((m) => m.content).join("\n");
    const content = `[mock:${model}] This is a simulated response. Set PROVIDER=ollama/openai/anthropic for real output.`;
    return {
      content,
      tokensIn: estimateTokens(promptText),
      tokensOut: estimateTokens(content),
      model,
    };
  }
}

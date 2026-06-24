export type Tier = "cheap" | "frontier";

export interface ModelPricing {
  /** USD per 1M input tokens */
  inputPer1M: number;
  /** USD per 1M output tokens */
  outputPer1M: number;
}

/**
 * Cloud reference prices. For local providers (Ollama) these are counterfactual:
 * "what you would have paid a cloud provider" — which is exactly the savings story.
 */
export const PRICING: Record<string, ModelPricing> = {
  // OpenAI
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  // Anthropic
  "claude-3-5-sonnet-latest": { inputPer1M: 3, outputPer1M: 15 },
  "claude-3-5-haiku-latest": { inputPer1M: 0.8, outputPer1M: 4 },
  // Ollama (local/free) mapped to cloud-equivalent reference prices
  "llama3.2:1b": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "llama3.1:8b": { inputPer1M: 2.5, outputPer1M: 10 },
  "llama3.2:latest": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "qwen2.5:3b": { inputPer1M: 2.5, outputPer1M: 10 },
  "dolphin3:latest": { inputPer1M: 2.5, outputPer1M: 10 },
  "llama2:latest": { inputPer1M: 2.5, outputPer1M: 10 },
};

export interface ProviderModels {
  cheap: string;
  frontier: string;
}

export const PROVIDER_MODELS: Record<string, ProviderModels> = {
  ollama: { cheap: "llama3.2:latest", frontier: "qwen2.5:3b" },
  openai: { cheap: "gpt-4o-mini", frontier: "gpt-4o" },
  anthropic: {
    cheap: "claude-3-5-haiku-latest",
    frontier: "claude-3-5-sonnet-latest",
  },
};

export function modelsFor(provider: string): ProviderModels {
  const base = PROVIDER_MODELS[provider];
  if (!base) throw new Error(`Unknown provider "${provider}"`);
  // Env overrides let you point tiers at any pulled model without code changes.
  return {
    cheap: process.env.CHEAP_MODEL ?? base.cheap,
    frontier: process.env.FRONTIER_MODEL ?? base.frontier,
  };
}

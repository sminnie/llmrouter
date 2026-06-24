import { PRICING } from "./pricing.js";

export function costUsd(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const p = PRICING[model];
  if (!p) return 0;
  return (tokensIn / 1e6) * p.inputPer1M + (tokensOut / 1e6) * p.outputPer1M;
}

export interface SavingsResult {
  baselineUsd: number;
  actualUsd: number;
  savingsUsd: number;
}

/**
 * Savings = counterfactual cost of sending every call to the frontier model
 * minus the actual cost of the chosen model.
 */
export function computeSavings(params: {
  frontierModel: string;
  chosenModel: string;
  tokensIn: number;
  tokensOut: number;
}): SavingsResult {
  const baselineUsd = costUsd(
    params.frontierModel,
    params.tokensIn,
    params.tokensOut,
  );
  const actualUsd = costUsd(params.chosenModel, params.tokensIn, params.tokensOut);
  return {
    baselineUsd,
    actualUsd,
    savingsUsd: Math.max(0, baselineUsd - actualUsd),
  };
}

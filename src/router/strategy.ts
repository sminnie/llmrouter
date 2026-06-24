import type { Tier } from "../pricing.js";

export type Strategy =
  | "cost-optimized"
  | "latency-first"
  | "quality"
  | "default";

export function normalizeStrategy(header?: string | string[]): Strategy {
  const raw = (Array.isArray(header) ? header[0] : header)?.toLowerCase().trim();
  switch (raw) {
    case "cost-optimized":
    case "cost":
      return "cost-optimized";
    case "latency-first":
    case "latency":
      return "latency-first";
    case "quality":
    case "quality-first":
      return "quality";
    default:
      return "default";
  }
}

/**
 * Complexity threshold above which a prompt earns the frontier model.
 * Strategy shifts the bar: cost/latency make frontier harder to earn,
 * quality makes it easier.
 */
export function thresholdFor(strategy: Strategy): number {
  switch (strategy) {
    case "cost-optimized":
      return 0.7;
    case "latency-first":
      return 0.75;
    case "quality":
      return 0.3;
    default:
      return 0.5;
  }
}

export function decideTier(score: number, strategy: Strategy): Tier {
  return score >= thresholdFor(strategy) ? "frontier" : "cheap";
}

import { describe, it, expect } from "vitest";
import { computeSavings, costUsd } from "../src/savings.js";
import { InMemoryMetricsStore } from "../src/metrics.js";

describe("savings", () => {
  it("computes cost from the pricing table", () => {
    // gpt-4o: 2.5/1M in, 10/1M out
    expect(costUsd("gpt-4o", 1_000_000, 0)).toBeCloseTo(2.5, 6);
    expect(costUsd("gpt-4o", 0, 1_000_000)).toBeCloseTo(10, 6);
  });

  it("returns positive savings when routed to the cheap model", () => {
    const r = computeSavings({
      frontierModel: "gpt-4o",
      chosenModel: "gpt-4o-mini",
      tokensIn: 1000,
      tokensOut: 1000,
    });
    expect(r.savingsUsd).toBeGreaterThan(0);
    expect(r.savingsUsd).toBeCloseTo(r.baselineUsd - r.actualUsd, 9);
  });

  it("returns zero savings when the frontier model is chosen", () => {
    const r = computeSavings({
      frontierModel: "gpt-4o",
      chosenModel: "gpt-4o",
      tokensIn: 1000,
      tokensOut: 1000,
    });
    expect(r.savingsUsd).toBe(0);
  });

  it("never returns negative savings", () => {
    const r = computeSavings({
      frontierModel: "gpt-4o-mini",
      chosenModel: "gpt-4o",
      tokensIn: 1000,
      tokensOut: 1000,
    });
    expect(r.savingsUsd).toBe(0);
  });
});

describe("metrics store", () => {
  it("aggregates savings and tier counts", () => {
    const store = new InMemoryMetricsStore();
    store.record({
      ts: new Date().toISOString(),
      model_selected: "gpt-4o-mini",
      tier: "cheap",
      strategy: "default",
      complexity: 0.2,
      tokens_in: 100,
      tokens_out: 100,
      baseline_usd: 0.5,
      savings_usd: 0.5,
    });
    store.record({
      ts: new Date().toISOString(),
      model_selected: "gpt-4o",
      tier: "frontier",
      strategy: "quality",
      complexity: 0.9,
      tokens_in: 100,
      tokens_out: 100,
      baseline_usd: 0.3,
      savings_usd: 0,
    });
    const s = store.summary();
    expect(s.total_requests).toBe(2);
    expect(s.total_savings_usd).toBeCloseTo(0.5, 9);
    expect(s.by_tier.cheap).toBe(1);
    expect(s.by_tier.frontier).toBe(1);
    expect(store.recent(1)).toHaveLength(1);
  });
});

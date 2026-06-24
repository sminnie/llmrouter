import { describe, it, expect } from "vitest";
import { classify } from "../src/router/classifier.js";
import { decideTier, normalizeStrategy } from "../src/router/strategy.js";

describe("classifier", () => {
  it("scores simple extraction/classification prompts low", () => {
    const c = classify("Classify this review as positive or negative: 'Loved it!'");
    expect(c.score).toBeLessThan(0.5);
    expect(c.matchedSimple).toContain("classify");
  });

  it("scores complex reasoning prompts high", () => {
    const c = classify(
      "Analyze this codebase step by step, debug the race condition, and explain why it happens.",
    );
    expect(c.score).toBeGreaterThan(0.5);
    expect(c.matchedComplex.length).toBeGreaterThan(0);
  });

  it("estimates more tokens for longer text", () => {
    const short = classify("hi");
    const long = classify("word ".repeat(500));
    expect(long.tokens).toBeGreaterThan(short.tokens);
  });
});

describe("strategy", () => {
  it("normalizes headers", () => {
    expect(normalizeStrategy("cost-optimized")).toBe("cost-optimized");
    expect(normalizeStrategy("LATENCY")).toBe("latency-first");
    expect(normalizeStrategy(undefined)).toBe("default");
    expect(normalizeStrategy("nonsense")).toBe("default");
  });

  it("cost-optimized keeps borderline prompts on the cheap tier", () => {
    const score = 0.6;
    expect(decideTier(score, "cost-optimized")).toBe("cheap");
    expect(decideTier(score, "default")).toBe("frontier");
  });

  it("quality routes borderline prompts to frontier", () => {
    expect(decideTier(0.35, "quality")).toBe("frontier");
    expect(decideTier(0.35, "default")).toBe("cheap");
  });
});

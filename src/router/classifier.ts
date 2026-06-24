const SIMPLE_KEYWORDS = [
  "classify",
  "categorize",
  "format",
  "extract",
  "translate",
  "summarize",
  "summarise",
  "label",
  "list",
  "rewrite",
  "spellcheck",
  "capitalize",
  "convert",
  "parse",
];

const COMPLEX_KEYWORDS = [
  "analyze",
  "analyse",
  "reason",
  "step by step",
  "step-by-step",
  "debug",
  "prove",
  "explain why",
  "architect",
  "design",
  "refactor",
  "optimize",
  "optimise",
  "derive",
  "evaluate",
  "compare",
  "strategy",
  "algorithm",
  "trade-off",
  "tradeoff",
];

export interface Classification {
  tokens: number;
  score: number; // 0 (simple) .. 1 (complex)
  matchedSimple: string[];
  matchedComplex: string[];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Cheap token estimate (~4 chars/token) — good enough for routing heuristics. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function classify(prompt: string): Classification {
  const text = prompt.toLowerCase();
  const tokens = estimateTokens(prompt);

  const matchedComplex = COMPLEX_KEYWORDS.filter((k) => text.includes(k));
  const matchedSimple = SIMPLE_KEYWORDS.filter((k) => text.includes(k));

  // Keyword signal: net complex-vs-simple keywords, squashed to 0..1.
  const net = matchedComplex.length - matchedSimple.length;
  const keywordScore = 1 / (1 + Math.exp(-net));

  // Length signal: longer prompts trend complex, saturating around 800 tokens.
  const lengthScore = clamp01(tokens / 800);

  // Multi-step signal: numbered lists / sequencing words hint at reasoning.
  const multiStep = /(\d+\.\s|\bthen\b|\bfirst,|\bsteps?\b)/.test(text)
    ? 0.15
    : 0;

  const score = clamp01(0.55 * keywordScore + 0.3 * lengthScore + multiStep);

  return { tokens, score, matchedSimple, matchedComplex };
}

# LLM Cost Router - MVP Proof Pack (VC Intro)

Date: 2026-08-18
Product stage: MVP (working demo + persistent metrics)

## 1) Headline Proof

| Metric | Value | Status |
|---|---:|---|
| Logged routed requests | 7 | Confirmed |
| Total baseline cost (would-have-paid) | $0.019500 | Confirmed |
| Total measured savings | $0.007043 | Confirmed |
| Savings rate | 36.12% | Confirmed |
| Cheap vs frontier routing split | 4 vs 3 (57.1% cheap) | Confirmed |
| Complexity separation (avg score) | cheap: 0.184, frontier: 0.688 | Confirmed |

Interpretation: on the current sample, the router is not randomly routing; it is separating lower-complexity and higher-complexity prompts while generating measurable cost savings.

## 2) Evidence Basis (Local, Reproducible)

Data source:
- data/metrics.jsonl (append-only request log)

Logic source:
- src/router/classifier.ts (complexity scoring)
- src/router/strategy.ts (tier thresholds)
- src/savings.ts (baseline vs actual cost math)
- src/metrics.ts and src/routes/metrics.ts (aggregation + summary endpoint)

Observed window:
- Start: 2026-08-18T19:29:51.896Z
- End: 2026-08-19T01:50:34.766Z

Additional confirmed stats:
- Avg savings per request: $0.001006
- Avg savings per cheap-tier request: $0.001761
- Model usage counts: llama3.2:latest (4), qwen2.5:3b (2), dolphin3:latest (1)

## 3) External Market Validation (Cited)

### 3.1 Pricing spread exists and is large
- OpenAI pricing page shows major spread between higher-capability and lower-cost models in the same family (example shown on page: GPT-5.6 Sol at $5 input / $30 output per 1M tokens vs GPT-5.6 Luna at $0.20 / $1.20, about 25x spread). [1]
- Anthropic pricing page shows spread across tiers (example shown: Opus 5 at $5 / $25, Sonnet 5 at $2 / $10, Haiku 4.5 at $1 / $5 per 1M tokens). [2]

Why this matters: even moderate routing accuracy can create meaningful savings when price deltas are multi-x.

### 3.2 Quality and benchmark context exists for lower-cost models
- OpenAI GPT-4o mini release reports strong benchmark performance at lower price points (for example MMLU 82.0%, HumanEval 87.2%, and $0.15 / $0.60 pricing in that release context). [3]

### 3.3 Independent benchmark ecosystem exists
- HELM provides a reproducible and transparent framework for model evaluation across many scenarios. [4]
- Artificial Analysis publishes independent intelligence, speed, and cost-per-task views with documented methodology. [5]

## 4) What This Proves vs Not Yet

### Proves now (Confirmed)
- Product works end-to-end with live routing, savings computation, and persistent logging.
- Routing behavior aligns with complexity signal separation on observed data.
- Cost savings are measurable in the MVP workflow.

### Not proven yet (Unknown)
- Stability and savings profile at larger production traffic (1000+ requests/day).
- Quality retention against a gold evaluation set for domain-specific tasks.
- Customer willingness to pay and retention after pilot.

## 5) Next Milestone (30 Days)

1. Run a reproducible 100-500 request benchmark pack on representative prompt mixes.
2. Publish side-by-side quality checks for cheap-tier vs frontier-tier outputs on a fixed eval set.
3. Convert 3 design partners and secure at least 1 paid pilot.

Success threshold for next VC update:
- >= 25% savings at stable quality on benchmark set
- >= 1 paid pilot using the router in a real workflow

---

## Citations

[1] OpenAI API pricing: https://openai.com/api/pricing/ (accessed 2026-08-18)

[2] Anthropic model pricing: https://platform.claude.com/docs/en/about-claude/pricing (accessed 2026-08-18)

[3] OpenAI GPT-4o mini release and benchmark/pricing claims: https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/ (accessed 2026-08-18)

[4] Stanford CRFM HELM overview: https://crfm.stanford.edu/helm/ (accessed 2026-08-18)

[5] Artificial Analysis (independent model intelligence/cost/speed index + methodology): https://artificialanalysis.ai/ (accessed 2026-08-18)

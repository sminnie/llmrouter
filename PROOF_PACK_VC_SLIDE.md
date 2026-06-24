# LLM Cost Router - 1-Slide VC Summary

## Headline
Cut LLM spend by 36.12% in live MVP routing while preserving a clear complexity-based escalation path.

## Problem + Why Now
- Public model pricing spreads are multi-x across tiers, so routing accuracy directly drives margin.
- Most teams still overpay by defaulting mixed workloads to expensive frontier models.

## MVP Proof (Current Data, Confirmed)
| KPI | Result |
|---|---:|
| Routed requests logged | 7 |
| Baseline spend (no routing) | $0.019500 |
| Measured savings | $0.007043 |
| Savings rate | 36.12% |
| Cheap vs frontier split | 4 vs 3 (57.1% cheap) |
| Complexity separation | cheap avg 0.184, frontier avg 0.688 |

## What This Product Does
- Scores prompt complexity in real time.
- Routes low-complexity prompts to lower-cost models.
- Escalates high-complexity prompts to frontier models.
- Logs every decision and cost delta in an append-only metrics stream.

## Investment Thesis
- Confirmed: end-to-end router works with measurable savings and auditable logs.
- Likely: this can become an infrastructure wedge for AI cost control plus quality governance.
- Unknown (next proof gate): quality retention and savings stability at 100-500 request benchmark scale.

## Next 30 Days (De-Risk Plan + Ask)
- Run a reproducible 100-500 prompt benchmark on representative mixes.
- Publish side-by-side quality eval (cheap-tier vs frontier-tier) on a fixed gold set.
- Convert 3 design partners and secure 1 paid pilot.
- Next investor checkpoint: >= 25% savings at stable quality and >= 1 paid pilot.

Sources: OpenAI pricing [1], Anthropic pricing [2], OpenAI GPT-4o mini benchmark context [3], HELM [4], Artificial Analysis [5].
[1] https://openai.com/api/pricing/
[2] https://platform.claude.com/docs/en/about-claude/pricing
[3] https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/
[4] https://crfm.stanford.edu/helm/
[5] https://artificialanalysis.ai/

# llmrouter

**Cut LLM spend 36% — automatically.** A lightweight API proxy that routes every prompt to
the **cheapest model that can do the job**, with an audited savings ledger for every call.

Simple prompts (classify, format, extract) go to a small/cheap model; complex, multi-step
reasoning escalates to a frontier model. Every response reports how much money the routing saved.

![LLM Router — 36.12% measured savings](proof-pack/preview.png)

## Measured results (MVP validation sample)

| Metric | Value |
|---|---:|
| Savings rate vs frontier-only baseline | **36.12%** |
| Traffic safely routed to cheap tier | **57%** |
| Complexity separation (avg score, cheap vs frontier) | **0.18 vs 0.69** |
| Baseline spend / actual savings | $0.0195 / $0.0070 |

Numbers are computed from the append-only log in `data/metrics.jsonl` — every request records
its complexity score, model selected, baseline cost, and savings. Reproduce them yourself:
run the server, send traffic, read `GET /metrics`.

The complexity separation is the honest-signal check: routing isn't random. Cheap-tier
requests average 0.18 complexity; frontier-tier requests average 0.69.

> This is an early sample (single-user MVP traffic). Next milestone: a reproducible
> 100–500 prompt benchmark with side-by-side quality evals — see [Roadmap](#roadmap).

## Why this matters

Public model pricing spreads are multi-x within the same provider family (25x between
top-tier and budget models is common). Most teams default all workloads to expensive
frontier models. Even moderate routing accuracy converts that price spread directly
into margin — **if** you can prove quality is preserved and audit every decision.

llmrouter is built around that proof: **counterfactual cost accounting**. Savings are
never estimated — each request logs the cost of the frontier model you *would* have paid
minus the cost of the model actually used, priced from [src/pricing.ts](src/pricing.ts).

## How it works

```
POST /route  ──►  classifier (token length + keyword scoring)
                    │
                    ├─ X-Strategy header shifts the routing threshold
                    ▼
              cheap tier  ◄──► frontier tier
                    │
                    ▼
              provider (Ollama | OpenAI | Anthropic)
                    │
                    ▼
   JSON response + X-Savings-USD / X-Model-Selected / X-Complexity-Score
```

1. **Score** — [src/router/classifier.ts](src/router/classifier.ts) scores prompt complexity
   in real time (token length + reasoning-keyword signals).
2. **Route** — [src/router/strategy.ts](src/router/strategy.ts) maps score → tier. The
   `X-Strategy` header (`cost-optimized | latency-first | quality | default`) shifts the
   threshold per request, so callers control the cost/quality tradeoff.
3. **Account** — [src/savings.ts](src/savings.ts) computes counterfactual savings;
   every decision and dollar delta lands in an append-only audit stream.
4. **Observe** — live savings dashboard at `/` and aggregates at `GET /metrics`.

## Quick start (local, free — Ollama)

```bash
# 1. Install Ollama models (default tiers)
ollama pull llama3.2:1b     # cheap tier
ollama pull llama3.1:8b     # frontier tier

# 2. Install deps
npm install

# 3. Configure
cp .env.example .env         # defaults to PROVIDER=ollama

# 4. Run
npm run dev                  # http://localhost:3000  (dashboard + API)
```

Open http://localhost:3000 for the live savings dashboard.

## Use a cloud provider (backup)

Set `PROVIDER` and the matching key in `.env`:

```bash
PROVIDER=openai
OPENAI_API_KEY=sk-...
# or
PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

## API

### `POST /route`

Headers: `X-Strategy: cost-optimized | latency-first | quality | default` (optional)

Body (either form):

```json
{ "prompt": "Classify this review: 'Loved it!'" }
```

```json
{ "system": "You are terse.", "messages": [{ "role": "user", "content": "..." }] }
```

Response headers: `X-Savings-USD`, `X-Model-Selected`, `X-Complexity-Score`, `X-Strategy`, `X-Tier`.

Example:

```bash
curl -sD - http://localhost:3000/route \
  -H 'content-type: application/json' \
  -H 'x-strategy: cost-optimized' \
  -d '{"prompt":"Classify this review as positive or negative: Loved it!"}'
```

```bash
curl -sD - http://localhost:3000/route \
  -H 'content-type: application/json' \
  -d '{"prompt":"Analyze this code step by step, debug the deadlock, and explain why it happens."}'
```

### `GET /metrics`

Cumulative savings, request count, and recent routing decisions (powers the dashboard).

### `GET /health`

Liveness check.

## Testing

```bash
npm test
```

## Design notes

- **Provider layer** is pluggable via a single `ProviderAdapter` interface
  ([src/providers](src/providers)). Adding a provider means implementing one interface.
- **Persistence** is behind a `MetricsStore` interface; the default `JsonlMetricsStore`
  is an append-only log (`data/metrics.jsonl`) with an in-memory aggregate — durable across
  restarts, zero native deps. Swap for SQLite/Postgres without touching routing.
- **Auditability first** — the savings ledger is designed so a finance or platform team
  can verify every routing decision after the fact. Cost governance, not just cost cutting.

## Roadmap

1. Reproducible 100–500 prompt benchmark pack on representative prompt mixes.
2. Side-by-side quality evals (cheap tier vs frontier tier) on a fixed gold set.
3. Target: ≥ 25% savings at stable quality on the benchmark set.

## Out of scope (MVP)

Streaming, auth, rate limiting, OpenAI-compatible surface, multi-provider fan-out.

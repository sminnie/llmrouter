# llmrouter

A lightweight API proxy that routes LLM prompts to the **cheapest model that can do the job**.
Simple prompts (classify, format, extract) go to a small/cheap model; complex, multi-step
reasoning goes to a frontier model. Every response reports how much money the routing saved.

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

Savings are **counterfactual**: the cost of sending the call to the frontier model minus
the cost of the model actually used, priced from `src/pricing.ts`.

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

- **Provider layer** is pluggable via a single `ProviderAdapter` interface (`src/providers`).
- **Persistence** is behind a `MetricsStore` interface; the default `JsonlMetricsStore`
  is an append-only log (`data/metrics.jsonl`) with an in-memory aggregate — durable across
  restarts, zero native deps. Swap for SQLite/Postgres without touching routing.

## Out of scope (MVP)

Streaming, auth, rate limiting, OpenAI-compatible surface, multi-provider fan-out.

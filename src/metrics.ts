import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

export interface MetricEntry {
  ts: string;
  model_selected: string;
  tier: string;
  strategy: string;
  complexity: number;
  tokens_in: number;
  tokens_out: number;
  baseline_usd: number;
  savings_usd: number;
}

export interface Summary {
  total_savings_usd: number;
  total_baseline_usd: number;
  total_requests: number;
  by_model: Record<string, number>;
  by_tier: Record<string, number>;
}

export interface MetricsStore {
  record(entry: MetricEntry): void;
  summary(): Summary;
  recent(n: number): MetricEntry[];
}

/** In-memory aggregate shared by both store implementations. */
class Aggregate {
  private total_savings = 0;
  private total_baseline = 0;
  private count = 0;
  private byModel: Record<string, number> = {};
  private byTier: Record<string, number> = {};
  private ring: MetricEntry[] = [];
  private readonly maxRing: number;

  constructor(maxRing = 200) {
    this.maxRing = maxRing;
  }

  add(entry: MetricEntry): void {
    this.total_savings += entry.savings_usd;
    this.total_baseline += entry.baseline_usd ?? 0;
    this.count += 1;
    this.byModel[entry.model_selected] =
      (this.byModel[entry.model_selected] ?? 0) + 1;
    this.byTier[entry.tier] = (this.byTier[entry.tier] ?? 0) + 1;
    this.ring.push(entry);
    if (this.ring.length > this.maxRing) this.ring.shift();
  }

  summary(): Summary {
    return {
      total_savings_usd: this.total_savings,
      total_baseline_usd: this.total_baseline,
      total_requests: this.count,
      by_model: { ...this.byModel },
      by_tier: { ...this.byTier },
    };
  }

  recent(n: number): MetricEntry[] {
    return this.ring.slice(-n).reverse();
  }
}

export class InMemoryMetricsStore implements MetricsStore {
  private agg = new Aggregate();
  record(entry: MetricEntry): void {
    this.agg.add(entry);
  }
  summary(): Summary {
    return this.agg.summary();
  }
  recent(n: number): MetricEntry[] {
    return this.agg.recent(n);
  }
}

/**
 * Append-only JSONL store. Durable across restarts, zero native deps.
 * Loads the file once at construction to rebuild the in-memory aggregate.
 */
export class JsonlMetricsStore implements MetricsStore {
  private agg = new Aggregate();
  private file: string;

  constructor(file = process.env.METRICS_FILE ?? "data/metrics.jsonl") {
    this.file = file;
    mkdirSync(dirname(file), { recursive: true });
    this.load();
  }

  private load(): void {
    if (!existsSync(this.file)) return;
    const raw = readFileSync(this.file, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        this.agg.add(JSON.parse(trimmed) as MetricEntry);
      } catch {
        // skip malformed line
      }
    }
  }

  record(entry: MetricEntry): void {
    appendFileSync(this.file, JSON.stringify(entry) + "\n");
    this.agg.add(entry);
  }

  summary(): Summary {
    return this.agg.summary();
  }

  recent(n: number): MetricEntry[] {
    return this.agg.recent(n);
  }
}

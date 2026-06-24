import type { FastifyPluginAsync } from "fastify";
import type { MetricsStore } from "../metrics.js";

export interface MetricsPluginOptions {
  store: MetricsStore;
}

export const metricsPlugin: FastifyPluginAsync<MetricsPluginOptions> = async (
  app,
  opts,
) => {
  const { store } = opts;

  app.get<{ Querystring: { limit?: string } }>("/metrics", async (req) => {
    const limit = Math.min(200, Number(req.query.limit ?? 25) || 25);
    return {
      summary: store.summary(),
      recent: store.recent(limit),
    };
  });
};

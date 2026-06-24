import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JsonlMetricsStore, type MetricsStore } from "./metrics.js";
import { routePlugin } from "./routes/route.js";
import { metricsPlugin } from "./routes/metrics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function buildServer(store: MetricsStore = new JsonlMetricsStore()): FastifyInstance {
  const app = Fastify({ logger: true });

  app.register(fastifyStatic, {
    root: join(__dirname, "..", "public"),
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(routePlugin, { store });
  app.register(metricsPlugin, { store });

  return app;
}

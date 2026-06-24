import { buildServer } from "./server.js";

const port = Number(process.env.PORT ?? 3000);
const app = buildServer();

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`llmrouter listening on http://localhost:${port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });

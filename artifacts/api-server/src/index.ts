import app from "./app";
import { logger } from "./lib/logger";
import { startBot } from "./bot/index";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

if (process.env.RAILWAY_ENVIRONMENT || process.env.BOT_ENABLED === "true") {
  startBot();
} else {
  logger.info("Bot disabled (set BOT_ENABLED=true or deploy to Railway to enable)");
}

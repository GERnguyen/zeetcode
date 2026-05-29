import express from "express";
import http from "http";
import { serverConfig } from "./config";
import v1Router from "./routers/v1/index.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import logger from "./config/logger.config";
import { attachCorrelationIdMiddleware } from "./middlewares/correlation.middleware";
import { connectDB } from "./config/db.config";
import { BattleFactory } from "./factories/battle.factory";
import { initBattleSocket, notifyRankedMatch } from "./socket/battle.socket";

const app = express();

app.use(express.json());

app.use(attachCorrelationIdMiddleware);
app.use("/api/v1", v1Router);

app.use(appErrorHandler);
app.use(genericErrorHandler);

const httpServer = http.createServer(app);

const battleService = BattleFactory.getBattleService();
initBattleSocket(httpServer, battleService);

let isMatching = false;

httpServer.listen(serverConfig.PORT, async () => {
  logger.info(`BattleService running on http://localhost:${serverConfig.PORT}`);
  logger.info("Press Ctrl+C to stop the server.");

  await connectDB();

  setInterval(async () => {
    if (isMatching) return;
    isMatching = true;
    try {
      const room = await battleService.tryMatchRanked();
      if (room) {
        await notifyRankedMatch(room, battleService);
      }
    } catch (error) {
      logger.error("Matchmaking loop failed", error);
    } finally {
      isMatching = false;
    }
  }, serverConfig.MATCHMAKING_INTERVAL_MS);
});

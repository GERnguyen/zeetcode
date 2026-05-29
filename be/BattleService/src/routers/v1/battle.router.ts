import express from "express";
import { authenticateAccessToken } from "../../middlewares/auth.middleware";
import { validateRequestBody, validateQueryParams } from "../../validators";
import {
  createPrivateRoomSchema,
  historyQuerySchema,
  joinPrivateRoomSchema,
} from "../../validators/battle.validator";
import {
  createPrivateRoomHandler,
  getBattleRoomHandler,
  getMyBattleHistoryHandler,
  joinPrivateRoomHandler,
} from "../../controllers/battle.controller";

const battleRouter = express.Router();

battleRouter.get(
  "/me/history",
  authenticateAccessToken,
  validateQueryParams(historyQuerySchema),
  getMyBattleHistoryHandler,
);

battleRouter.post(
  "/private",
  authenticateAccessToken,
  validateRequestBody(createPrivateRoomSchema),
  createPrivateRoomHandler,
);

battleRouter.post(
  "/private/:roomId/join",
  authenticateAccessToken,
  validateRequestBody(joinPrivateRoomSchema),
  joinPrivateRoomHandler,
);

battleRouter.get("/:roomId", authenticateAccessToken, getBattleRoomHandler);

export default battleRouter;

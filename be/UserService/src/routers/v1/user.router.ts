import express from "express";
import {
  changePasswordHandler,
  getUserEloHandler,
  getProfileHandler,
  updateProfileHandler,
  updateUserEloHandler,
} from "../../controllers/user.controller";
import {
  authenticateAccessToken,
  authenticateServiceToken,
} from "../../middlewares/auth.middleware";
import { validateRequestBody, validateRequestParams } from "../../validators";
import {
  changePasswordSchema,
  updateUserEloSchema,
  userIdParamsSchema,
  updateUserSchema,
} from "../../validators/user.validator";

const userRouter = express.Router();

userRouter.get("/me", authenticateAccessToken, getProfileHandler);

userRouter.patch(
  "/me",
  authenticateAccessToken,
  validateRequestBody(updateUserSchema),
  updateProfileHandler,
);

userRouter.post(
  "/me/change-password",
  authenticateAccessToken,
  validateRequestBody(changePasswordSchema),
  changePasswordHandler,
);

userRouter.get(
  "/:id/elo",
  authenticateServiceToken,
  validateRequestParams(userIdParamsSchema),
  getUserEloHandler,
);

userRouter.patch(
  "/:id/elo",
  authenticateServiceToken,
  validateRequestParams(userIdParamsSchema),
  validateRequestBody(updateUserEloSchema),
  updateUserEloHandler,
);

export default userRouter;

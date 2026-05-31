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
import { rateLimit } from "../../middlewares/rate-limit.middleware";

const userRouter = express.Router();
const passwordChangeLimiter = rateLimit({
  keyPrefix: "password-change",
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
});

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
  passwordChangeLimiter,
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

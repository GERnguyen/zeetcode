import express from "express";
import {
  changePasswordHandler,
  getProfileHandler,
  updateProfileHandler,
} from "../../controllers/user.controller";
import { authenticateAccessToken } from "../../middlewares/auth.middleware";
import { validateRequestBody } from "../../validators";
import {
  changePasswordSchema,
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

export default userRouter;

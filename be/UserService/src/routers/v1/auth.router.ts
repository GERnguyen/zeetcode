import express from "express";
import {
  confirmPasswordChangeHandler,
  confirmSignupHandler,
  loginUserHandler,
  logoutUserHandler,
  refreshTokenHandler,
  registerUserHandler,
  requestPasswordResetHandler,
  resetPasswordHandler,
} from "../../controllers/user.controller";
import { validateRequestBody } from "../../validators";
import {
  confirmPasswordChangeSchema,
  confirmSignupSchema,
  loginUserSchema,
  refreshTokenSchema,
  registerUserSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "../../validators/user.validator";

const authRouter = express.Router();

authRouter.post(
  "/register",
  validateRequestBody(registerUserSchema),
  registerUserHandler,
);

authRouter.post(
  "/login",
  validateRequestBody(loginUserSchema),
  loginUserHandler,
);

authRouter.post(
  "/refresh",
  validateRequestBody(refreshTokenSchema),
  refreshTokenHandler,
);

authRouter.post(
  "/logout",
  validateRequestBody(refreshTokenSchema),
  logoutUserHandler,
);

authRouter.post(
  "/confirm",
  validateRequestBody(confirmSignupSchema),
  confirmSignupHandler,
);

authRouter.post(
  "/confirm-change",
  validateRequestBody(confirmPasswordChangeSchema),
  confirmPasswordChangeHandler,
);

authRouter.post(
  "/password/reset/request",
  validateRequestBody(requestPasswordResetSchema),
  requestPasswordResetHandler,
);

authRouter.post(
  "/password/reset",
  validateRequestBody(resetPasswordSchema),
  resetPasswordHandler,
);

export default authRouter;

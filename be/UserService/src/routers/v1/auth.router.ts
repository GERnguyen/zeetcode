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
import { rateLimit } from "../../middlewares/rate-limit.middleware";

const authRouter = express.Router();
const authWriteLimiter = rateLimit({
  keyPrefix: "auth-write",
  maxRequests: 20,
  windowMs: 15 * 60 * 1000,
});
const loginLimiter = rateLimit({
  keyPrefix: "auth-login",
  maxRequests: 8,
  windowMs: 15 * 60 * 1000,
});
const passwordResetLimiter = rateLimit({
  keyPrefix: "password-reset",
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
});

authRouter.post(
  "/register",
  authWriteLimiter,
  validateRequestBody(registerUserSchema),
  registerUserHandler,
);

authRouter.post(
  "/login",
  loginLimiter,
  validateRequestBody(loginUserSchema),
  loginUserHandler,
);

authRouter.post(
  "/refresh",
  authWriteLimiter,
  validateRequestBody(refreshTokenSchema),
  refreshTokenHandler,
);

authRouter.post(
  "/logout",
  authWriteLimiter,
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
  passwordResetLimiter,
  validateRequestBody(requestPasswordResetSchema),
  requestPasswordResetHandler,
);

authRouter.post(
  "/password/reset",
  validateRequestBody(resetPasswordSchema),
  resetPasswordHandler,
);

export default authRouter;

import { NextFunction, Request, Response } from "express";
import {
  changePassword,
  confirmPasswordChange,
  confirmSignup,
  getUserProfile,
  loginUser,
  logoutUser,
  refreshAuthTokens,
  registerUser,
  requestPasswordReset,
  resetPassword,
  updateUserProfile,
} from "../services/user.service";
import {
  ChangePasswordDto,
  ConfirmPasswordChangeDto,
  ConfirmSignupDto,
  LoginUserDto,
  RefreshTokenDto,
  RegisterUserDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  UpdateUserDto,
} from "../validators/user.validator";
import { AuthRequest } from "../middlewares/auth.middleware";

export const registerUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body as RegisterUserDto;
    const result = await registerUser(payload);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const loginUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload = req.body as LoginUserDto;
    const result = await loginUser(payload);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body as RefreshTokenDto;
    const tokens = await refreshAuthTokens(refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
};

export const logoutUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body as RefreshTokenDto;
    await logoutUser(refreshToken);
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

export const getProfileHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const profile = await getUserProfile(userId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateProfileHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const payload = req.body as UpdateUserDto;
    const profile = await updateUserProfile(userId, payload);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const changePasswordHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const payload = req.body as ChangePasswordDto;
    await changePassword(userId, payload);
    res.status(200).json({
      success: true,
      message: "Confirmation link sent to your email",
    });
  } catch (error) {
    next(error);
  }
};

export const confirmPasswordChangeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.body as ConfirmPasswordChangeDto;
    await confirmPasswordChange(token);
    res.status(200).json({ success: true, message: "Password updated" });
  } catch (error) {
    next(error);
  }
};

export const confirmSignupHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.body as ConfirmSignupDto;
    await confirmSignup(token);
    res.status(200).json({ success: true, message: "Email verified" });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordResetHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body as RequestPasswordResetDto;
    await requestPasswordReset(email);
    res.status(200).json({
      success: true,
      message: "If the email exists, a reset link was sent",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, newPassword } = req.body as ResetPasswordDto;
    await resetPassword(token, newPassword);
    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

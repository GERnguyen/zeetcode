import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.config";
import { serverConfig } from "../config";
import logger from "../config/logger.config";
import {
  BadRequestError,
  ConflictError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors/app.error";
import {
  ChangePasswordDto,
  LoginUserDto,
  RegisterUserDto,
  UpdateUserDto,
} from "../validators/user.validator";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserById,
} from "../repositories/user.repository";
import { EmailTokenPurpose, User, UserRole } from "../generated/prisma/client";
import { sendEmail } from "./email.service";

type PublicUser = Omit<User, "password">;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type RefreshPayload = {
  userId: string;
  role: UserRole;
  type: "refresh";
  tokenId: string;
};

const toPublicUser = (user: User): PublicUser => {
  const { password, ...rest } = user;
  return rest;
};

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const decodeExpiry = (token: string) => {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  if (!decoded?.exp) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(decoded.exp * 1000);
};

const signAccessToken = (user: User) =>
  jwt.sign(
    { userId: user.id, role: user.role, type: "access" },
    serverConfig.JWT_ACCESS_SECRET,
    { expiresIn: serverConfig.JWT_ACCESS_EXPIRES_IN },
  );

const signRefreshToken = (user: User, tokenId: string) =>
  jwt.sign(
    { userId: user.id, role: user.role, type: "refresh", tokenId },
    serverConfig.JWT_REFRESH_SECRET,
    { expiresIn: serverConfig.JWT_REFRESH_EXPIRES_IN },
  );

const createRefreshTokenRecord = async (
  user: User,
  tokenId: string,
  refreshToken: string,
) => {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = decodeExpiry(refreshToken);

  return prisma.refreshToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });
};

const issueAuthTokens = async (user: User): Promise<AuthTokens> => {
  const accessToken = signAccessToken(user);
  const refreshTokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user, refreshTokenId);

  await createRefreshTokenRecord(user, refreshTokenId, refreshToken);

  return { accessToken, refreshToken };
};

const revokeRefreshToken = async (tokenId: string) => {
  await prisma.refreshToken.updateMany({
    where: { id: tokenId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

const revokeAllRefreshTokens = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

const createEmailToken = async (
  user: User,
  purpose: EmailTokenPurpose,
  payload?: string,
) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + serverConfig.EMAIL_TOKEN_EXPIRES_MINUTES * 60 * 1000,
  );

  await prisma.emailToken.create({
    data: {
      userId: user.id,
      tokenHash,
      purpose,
      payload,
      expiresAt,
    },
  });

  return rawToken;
};

const consumeEmailToken = async (token: string, purpose: EmailTokenPurpose) => {
  const tokenHash = hashToken(token);

  const record = await prisma.emailToken.findFirst({
    where: {
      tokenHash,
      purpose,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) {
    throw new BadRequestError("Token is invalid or expired");
  }

  await prisma.emailToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
};

const buildEmailLink = (path: string, token: string) =>
  `${serverConfig.FRONTEND_URL}${path}?token=${token}`;

export const registerUser = async (payload: RegisterUserDto) => {
  const hashedPassword = await bcrypt.hash(
    payload.password,
    serverConfig.BCRYPT_SALT_ROUNDS,
  );

  try {
    const user = await createUser({
      username: payload.username,
      email: payload.email,
      password: hashedPassword,
    });

    const emailToken = await createEmailToken(
      user,
      EmailTokenPurpose.SIGNUP_CONFIRM,
    );
    const confirmLink = buildEmailLink("/auth/confirm", emailToken);

    await sendEmail({
      to: user.email,
      subject: "Confirm your account",
      html: `<p>Click the link to confirm your account:</p><p><a href="${confirmLink}">${confirmLink}</a></p>`,
    });

    return {
      user: toPublicUser(user),
      message: "Please verify your email to continue",
    };
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    logger.error("Failed to register user", { error, email: payload.email });
    throw new InternalServerError("Failed to register user");
  }
};

export const loginUser = async (payload: LoginUserDto) => {
  const user = await findUserByEmail(payload.email);
  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  if (!user.emailVerified) {
    throw new UnauthorizedError("Email is not verified");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const tokens = await issueAuthTokens(user);
  return { user: toPublicUser(user), tokens };
};

export const confirmSignup = async (token: string) => {
  const record = await consumeEmailToken(
    token,
    EmailTokenPurpose.SIGNUP_CONFIRM,
  );

  const updated = await updateUserById(record.userId, {
    emailVerified: true,
    emailVerifiedAt: new Date(),
  });

  if (!updated) {
    throw new NotFoundError("User not found");
  }

  await revokeAllRefreshTokens(record.userId);
};

export const refreshAuthTokens = async (refreshToken: string) => {
  let decoded: RefreshPayload;
  try {
    decoded = jwt.verify(
      refreshToken,
      serverConfig.JWT_REFRESH_SECRET,
    ) as RefreshPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  if (decoded.type !== "refresh") {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { id: decoded.tokenId },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    // Possible token reuse or replay: revoke all refresh tokens for this user
    try {
      await revokeAllRefreshTokens(decoded.userId);
    } catch (err) {
      logger.error(
        "Failed to revoke all refresh tokens after detected revoked token",
        {
          error: err,
          userId: decoded.userId,
        },
      );
    }

    throw new UnauthorizedError("Refresh token has been revoked");
  }

  if (storedToken.tokenHash !== hashToken(refreshToken)) {
    // Token hash mismatch indicates token theft; revoke all tokens for the user
    try {
      await revokeAllRefreshTokens(decoded.userId);
    } catch (err) {
      logger.error("Failed to revoke all refresh tokens after token mismatch", {
        error: err,
        userId: decoded.userId,
      });
    }

    throw new UnauthorizedError("Refresh token mismatch");
  }

  const user = await findUserById(decoded.userId);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  return prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = signAccessToken(user);
    const newRefreshTokenId = crypto.randomUUID();
    const newRefreshToken = signRefreshToken(user, newRefreshTokenId);
    const newHash = hashToken(newRefreshToken);

    await tx.refreshToken.create({
      data: {
        id: newRefreshTokenId,
        userId: user.id,
        tokenHash: newHash,
        expiresAt: decodeExpiry(newRefreshToken),
        replacedByTokenId: null,
      },
    });

    await tx.refreshToken.update({
      where: { id: storedToken.id },
      data: { replacedByTokenId: newRefreshTokenId },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  });
};

export const logoutUser = async (refreshToken: string) => {
  let decoded: RefreshPayload;
  try {
    decoded = jwt.verify(
      refreshToken,
      serverConfig.JWT_REFRESH_SECRET,
    ) as RefreshPayload;
  } catch (error) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  await revokeRefreshToken(decoded.tokenId);
};

export const getUserProfile = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return toPublicUser(user);
};

export const updateUserProfile = async (
  userId: string,
  payload: UpdateUserDto,
) => {
  const user = await updateUserById(userId, payload);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return toPublicUser(user);
};

export const changePassword = async (
  userId: string,
  payload: ChangePasswordDto,
) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.currentPassword,
    user.password,
  );

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid current password");
  }

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    serverConfig.BCRYPT_SALT_ROUNDS,
  );

  const emailToken = await createEmailToken(
    user,
    EmailTokenPurpose.SENSITIVE_CHANGE,
    hashedPassword,
  );
  const confirmLink = buildEmailLink("/auth/confirm-change", emailToken);

  await sendEmail({
    to: user.email,
    subject: "Confirm your password change",
    html: `<p>Click the link to confirm your password change:</p><p><a href="${confirmLink}">${confirmLink}</a></p>`,
  });
};

export const confirmPasswordChange = async (token: string) => {
  const record = await consumeEmailToken(
    token,
    EmailTokenPurpose.SENSITIVE_CHANGE,
  );

  if (!record.payload) {
    throw new BadRequestError("Invalid confirmation payload");
  }

  const updated = await updateUserById(record.userId, {
    password: record.payload,
  });
  if (!updated) {
    throw new NotFoundError("User not found");
  }
  await revokeAllRefreshTokens(record.userId);
};

export const requestPasswordReset = async (email: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    logger.warn("Password reset requested for non-existent email", { email });
    return;
  }

  const emailToken = await createEmailToken(
    user,
    EmailTokenPurpose.PASSWORD_RESET,
  );
  const resetLink = buildEmailLink("/auth/reset-password", emailToken);

  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    html: `<p>Click the link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
  });
};

export const resetPassword = async (token: string, newPassword: string) => {
  const record = await consumeEmailToken(
    token,
    EmailTokenPurpose.PASSWORD_RESET,
  );

  const user = await findUserById(record.userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    serverConfig.BCRYPT_SALT_ROUNDS,
  );

  const updated = await updateUserById(user.id, { password: hashedPassword });
  if (!updated) {
    throw new NotFoundError("User not found");
  }
  await revokeAllRefreshTokens(user.id);
};

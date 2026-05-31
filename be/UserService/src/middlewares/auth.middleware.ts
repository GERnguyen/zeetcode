import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { serverConfig } from "../config";
import { ForbiddenError, UnauthorizedError } from "../utils/errors/app.error";
import { UserRole } from "../generated/prisma/client";

export interface AuthUserPayload {
  id: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

type JwtAccessPayload = {
  userId: string;
  role: UserRole;
  type: "access";
};

type JwtRefreshPayload = {
  userId: string;
  role: UserRole;
  type: "refresh";
  tokenId: string;
};

const getBearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : undefined;
};

export const authenticateAccessToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = getBearerToken(req);

  if (!token) {
    return next(new UnauthorizedError("Authentication token required"));
  }

  try {
    const decoded = jwt.verify(
      token,
      serverConfig.JWT_ACCESS_SECRET,
    ) as JwtAccessPayload;

    if (decoded.type !== "access") {
      return next(new UnauthorizedError("Invalid access token"));
    }

    req.user = { id: decoded.userId, role: decoded.role };
    return next();
  } catch (error) {
    return next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const authenticateRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = getBearerToken(req);

  if (!token) {
    return next(new UnauthorizedError("Refresh token required"));
  }

  try {
    const decoded = jwt.verify(
      token,
      serverConfig.JWT_REFRESH_SECRET,
    ) as JwtRefreshPayload;

    if (decoded.type !== "refresh") {
      return next(new UnauthorizedError("Invalid refresh token"));
    }

    req.body.refreshToken = token;
    return next();
  } catch (error) {
    return next(new UnauthorizedError("Invalid or expired refresh token"));
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  if (req.user.role !== "ADMIN") {
    return next(new ForbiddenError("Admin access required"));
  }

  return next();
};

export const requireSelfOrAdmin = (paramKey = "id") => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    const targetId = req.params[paramKey];

    if (req.user.role === "ADMIN" || req.user.id === targetId) {
      return next();
    }

    return next(new ForbiddenError("Access denied"));
  };
};

export const authenticateServiceToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.headers["x-service-token"];
  if (!token || typeof token !== "string") {
    return next(new UnauthorizedError("Service token required"));
  }

  if (!serverConfig.INTERNAL_SERVICE_TOKEN) {
    return next(new UnauthorizedError("Service token is not configured"));
  }

  if (token !== serverConfig.INTERNAL_SERVICE_TOKEN) {
    return next(new UnauthorizedError("Invalid service token"));
  }

  return next();
};

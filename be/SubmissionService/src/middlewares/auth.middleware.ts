import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { serverConfig } from "../config";
import { UnauthorizedError } from "../utils/errors/app.error";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

type AccessTokenPayload = JwtPayload & {
  userId?: string;
  role?: string;
  type?: string;
};

export const authenticateAccessToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication token required");
  }

  if (!serverConfig.JWT_ACCESS_SECRET) {
    throw new UnauthorizedError("JWT access secret is not configured");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const decoded = jwt.verify(
    token,
    serverConfig.JWT_ACCESS_SECRET,
  ) as AccessTokenPayload;

  if (!decoded.userId) {
    throw new UnauthorizedError("Invalid authentication token");
  }

  if (decoded.type && decoded.type !== "access") {
    throw new UnauthorizedError("Access token required");
  }

  (req as AuthenticatedRequest).user = {
    id: decoded.userId,
    role: decoded.role,
  };

  next();
};

export const authenticateServiceToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const token = req.headers["x-service-token"];
  if (!token || typeof token !== "string") {
    throw new UnauthorizedError("Service token required");
  }

  if (!serverConfig.INTERNAL_SERVICE_TOKEN) {
    throw new UnauthorizedError("Service token is not configured");
  }

  if (token !== serverConfig.INTERNAL_SERVICE_TOKEN) {
    throw new UnauthorizedError("Invalid service token");
  }

  next();
};

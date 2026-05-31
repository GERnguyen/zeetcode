import { NextFunction, Request, Response } from "express";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export const authenticatedUserRateLimit = ({
  keyPrefix,
  maxRequests,
  windowMs,
}: {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const fallbackIp = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${userId || fallbackIp}`;
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    buckets.set(key, current);
    res.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));

    if (current.count > maxRequests) {
      res.status(429).json({
        success: false,
        message: "Too many submissions. Please slow down.",
      });
      return;
    }

    return next();
  };
};

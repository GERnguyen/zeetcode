import { NextFunction, Request, Response } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
};

const getClientKey = (req: Request, keyPrefix: string) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0];
  const ip = forwardedIp?.trim() || req.ip || req.socket.remoteAddress || "unknown";
  return `${keyPrefix}:${ip}`;
};

export const rateLimit = ({
  windowMs,
  maxRequests,
  keyPrefix,
}: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = getClientKey(req, keyPrefix);
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
        message: "Too many requests. Please try again later.",
      });
      return;
    }

    return next();
  };
};

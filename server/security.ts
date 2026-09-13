import crypto from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}, 60_000);
cleanup.unref();

export function safeRequestId(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{1,80}$/.test(value)
    ? value
    : crypto.randomUUID();
}

export function rateLimit(name: string, limit: number, windowMs: number): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${name}:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };
    buckets.set(key, bucket);

    const remaining = Math.max(0, limit - bucket.count);
    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > limit) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }
    next();
  };
}

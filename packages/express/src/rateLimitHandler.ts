import { Handler } from "express";
import {
  consumeRateLimit,
  RateLimitTier,
  resolveClientIp,
} from "@recipesage/util/server/general";

export const rateLimitHandler = (tier: RateLimitTier): Handler => {
  return (req, res, next) => {
    consumeRateLimit(tier, resolveClientIp(req))
      .then((result) => {
        if (result.allowed) {
          next();
          return;
        }

        res.setHeader("Retry-After", result.retryAfterSeconds);
        res.status(429).send("Too many requests");
      })
      .catch(next);
  };
};

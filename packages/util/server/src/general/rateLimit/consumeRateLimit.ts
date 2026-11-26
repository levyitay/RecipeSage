import {
  RateLimiterRedis,
  RateLimiterMemory,
  RateLimiterRes,
} from "rate-limiter-flexible";
import * as Sentry from "@sentry/node";
import { getRateLimitRedisClient } from "./rateLimitRedisClient";
import { RATE_LIMIT_TIERS, RateLimitTier } from "./rateLimitTiers";
import { config } from "../config";
import { metrics } from "../metrics";

const limiters = new Map<RateLimitTier, RateLimiterRedis>();

const getLimiter = (tier: RateLimitTier) => {
  const existing = limiters.get(tier);
  if (existing) return existing;

  const tierConfig = RATE_LIMIT_TIERS[tier];

  const insuranceLimiter = new RateLimiterMemory({
    keyPrefix: `rl:${tier}:insurance`,
    points: tierConfig.points,
    duration: tierConfig.duration,
    blockDuration: tierConfig.blockDuration,
  });

  const limiter = new RateLimiterRedis({
    storeClient: getRateLimitRedisClient(),
    keyPrefix: `rl:${tier}`,
    points: tierConfig.points,
    duration: tierConfig.duration,
    blockDuration: tierConfig.blockDuration,
    insuranceLimiter,
  });

  limiters.set(tier, limiter);
  return limiter;
};

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export const consumeRateLimit = async (
  tier: RateLimitTier,
  key: string | null,
): Promise<RateLimitResult> => {
  if (!config.rateLimit.enabled) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (!key) {
    metrics.rateLimitClientIpUnresolved.inc();
    return { allowed: true, retryAfterSeconds: 0 };
  }

  try {
    await getLimiter(tier).consume(key);
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(err.msBeforeNext / 1000),
      };
    }

    Sentry.captureException(err);
    console.error(err);
    return { allowed: true, retryAfterSeconds: 0 };
  }
};

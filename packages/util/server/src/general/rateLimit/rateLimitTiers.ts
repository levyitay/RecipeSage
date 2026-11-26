export type RateLimitTier = "global" | "default" | "auth" | "ai" | "search";

interface RateLimitTierConfig {
  points: number;
  duration: number;
  blockDuration: number;
}

// Each tier lets you make `points` requests every `duration` seconds. Go over
// and you're blocked for `blockDuration` seconds (0 just means you wait out the
// window, no extra penalty).
export const RATE_LIMIT_TIERS: Record<RateLimitTier, RateLimitTierConfig> = {
  global: { points: 90, duration: 9, blockDuration: 0 },
  default: { points: 60, duration: 60, blockDuration: 0 },
  auth: { points: 10, duration: 300, blockDuration: 900 },
  ai: { points: 15, duration: 60, blockDuration: 0 },
  search: { points: 30, duration: 60, blockDuration: 0 },
};

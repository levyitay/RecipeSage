import Redis from "ioredis";
import * as Sentry from "@sentry/node";
import { config } from "../config";

let client: Redis | undefined;

export const getRateLimitRedisClient = () => {
  if (client) return client;

  client = new Redis({
    host: config.rateLimit.redisHost,
    port: config.rateLimit.redisPort,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  });

  client.on("error", (err) => {
    Sentry.captureException(err);
    console.error(err);
  });

  return client;
};

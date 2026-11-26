import { inferAsyncReturnType, initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { createContext } from "./context";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import { customTrpcTransformer } from "@recipesage/util/shared";
import {
  consumeRateLimit,
  RateLimitTier,
} from "@recipesage/util/server/general";
import * as Sentry from "@sentry/node";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().meta<OpenApiMeta>().create({
  transformer: customTrpcTransformer,
});

const sentryMiddleware = t.middleware(
  Sentry.trpcMiddleware({
    attachRpcInput: true,
  }),
);

const otelMiddleware = t.middleware(async ({ path, next }) => {
  const tracer = trace.getTracer("trpc");

  return tracer.startActiveSpan(`tRPC: ${path}`, async (span) => {
    try {
      const result = await next();
      span.setAttribute("rpc.method", path);
      span.updateName(`/trpc/${path}`); // Change span name to reflect the procedure
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
});

const RATE_LIMIT_TIER_BY_PATH: [string, RateLimitTier][] = [
  ["users.login", "auth"],
  ["users.register", "auth"],
  ["users.forgotPassword", "auth"],
  ["users.signInWithGoogle", "auth"],
  ["users.signInWithDesktopGoogle", "auth"],
  ["ml.", "ai"],
  ["assistant.", "ai"],
  ["recipes.searchRecipes", "search"],
  ["recipes.searchRecipesByIngredients", "search"],
  ["discover.searchDiscoverRecipes", "search"],
];

const getRateLimitTier = (path: string): RateLimitTier => {
  for (const [prefix, tier] of RATE_LIMIT_TIER_BY_PATH) {
    if (path === prefix || path.startsWith(prefix)) return tier;
  }
  return "default";
};

const rateLimitMiddleware = t.middleware(async ({ path, ctx, next }) => {
  const tier = getRateLimitTier(path);

  const result = await consumeRateLimit(tier, ctx.ip);
  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests, please try again later.",
    });
  }

  return next();
});

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure
  .use(otelMiddleware)
  .use(sentryMiddleware)
  .use(rateLimitMiddleware);

export const authenticatedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      message: "Must be logged in",
      code: "UNAUTHORIZED",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

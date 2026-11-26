import { PrismaClient, Prisma } from "./prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import cursorStream from "prisma-cursorstream";
import client from "prom-client";

const prismaQuery = new client.Histogram({
  name: "prisma_query",
  help: "Every time a query is made by the prisma client",
  labelNames: ["role"],
  buckets: [3, 5, 10, 20, 40, 70, 100, 200, 500, 1000, 5000], // Each of these is tracked in milliseconds
});

export * from "./types";
export * from "./prisma/generated/client";

const log: Prisma.LogDefinition[] = [
  {
    level: "error",
    emit: "stdout",
  },
  {
    level: "info",
    emit: "stdout",
  },
  {
    level: "warn",
    emit: "stdout",
  },
  {
    level: "query",
    emit: "event",
  },
];

const buildClient = (
  role: "primary" | "replica",
  connectionString: string | undefined,
) => {
  const adapter = new PrismaPg({
    connectionString,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? {
            rejectUnauthorized:
              process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
          }
        : false,
  });

  const built = new PrismaClient({
    adapter,
    log,
  });

  built.$on("query", (e) => {
    if (process.env.PRISMA_DEBUG_ENABLE === "true") {
      console.log("Query: " + e.query);
      console.log("Params: " + e.params);
      console.log("Duration: " + e.duration + "ms");
    }
    prismaQuery.observe({ role }, e.duration);
  });

  return built;
};

const _prisma = buildClient("primary", process.env.DATABASE_URL);

export const prisma = _prisma;
export const prismaReplica = process.env.DATABASE_REPLICA_URL
  ? buildClient("replica", process.env.DATABASE_REPLICA_URL)
  : _prisma;
/**
 * A separate export of Prisma for cursorStream functionality since extends modifies the base type very oddly.
 */
export const prismaCursorStream = _prisma.$extends(cursorStream);

export type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

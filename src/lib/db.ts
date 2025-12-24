import "server-only";

import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Creates a Prisma client using the PostgreSQL driver adapter.
 *
 * Note: we intentionally do NOT throw at module import time if `DATABASE_URL`
 * is missing. Next.js may import server modules during build to collect route
 * configuration; throwing here would break Vercel builds.
 */
function createPrismaClient(connectionString: string) {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  // Prisma 7 requires an adapter to be provided
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function createMissingDbProxy(): PrismaClient {
  const error = new Error("DATABASE_URL environment variable is not set");

  // We only need imports to succeed during build; any actual DB access should
  // still fail loudly when this proxy is used.
  return new Proxy(
    {},
    {
      get() {
        throw error;
      },
    },
  ) as PrismaClient;
}

const connectionString = process.env.DATABASE_URL;

export const db =
  globalForPrisma.prisma ??
  (connectionString ? createPrismaClient(connectionString) : createMissingDbProxy());

if (process.env.NODE_ENV !== "production" && connectionString) {
  globalForPrisma.prisma = db;
}

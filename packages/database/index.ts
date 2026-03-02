import * as Prisma from "@prisma/client";

type PrismaClientCtor = new (options?: {
  log?: Array<"query" | "info" | "warn" | "error">;
}) => unknown;

const PrismaClient = (Prisma as unknown as { PrismaClient: PrismaClientCtor })
  .PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __spaceflowPrisma: unknown;
}

export const db =
  global.__spaceflowPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__spaceflowPrisma = db;
}

export * from "@prisma/client";
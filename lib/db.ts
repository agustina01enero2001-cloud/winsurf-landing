import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

const SCHEMA_VERSION = "tenant-v6-origin-suborigin";

function resolveSqliteUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./data.db";
  if (!raw.startsWith("file:")) return raw;
  const filePath = raw.replace(/^file:/, "");
  if (path.isAbsolute(filePath)) return raw;
  return `file:${path.join(process.cwd(), filePath)}`;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl() });
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaSchemaVersion === SCHEMA_VERSION &&
    typeof (globalForPrisma.prisma as unknown as { tenant?: unknown }).tenant ===
      "object"
  ) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
  return client;
}

export const prisma = getPrisma();

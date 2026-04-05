import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * URL pour @prisma/adapter-better-sqlite3 : après retrait de "file:", le chemin doit être
 * valide pour better-sqlite3 (ex. C:/path/db.db). Éviter file:///... qui devient ///C:/...
 * et provoque "Cannot open database because the directory does not exist".
 */
function sqliteAdapterUrl(): string {
  const envUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  if (envUrl === ":memory:") return ":memory:";

  const raw = envUrl.replace(/^file:/, "").trim();
  if (!raw) return envUrl;

  const filePath = path.isAbsolute(raw)
    ? path.normalize(raw)
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), raw);

  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const posix = filePath.split(path.sep).join("/");
  return `file:${posix}`;
}

const adapter = new PrismaBetterSqlite3({ url: sqliteAdapterUrl() });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

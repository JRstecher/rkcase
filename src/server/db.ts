import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/** Résout le chemin du fichier SQLite depuis `DATABASE_URL` (ex. file:./dev.db ou file:/data/dev.db). */
function resolveSqliteDatabasePath(): string {
  const raw = (process.env.DATABASE_URL ?? "file:./dev.db").trim();
  if (!raw.startsWith("file:")) {
    return path.join(
      /* turbopackIgnore: true */ process.cwd(),
      "dev.db",
    );
  }
  const afterScheme = raw.slice("file:".length);
  if (afterScheme.startsWith("//")) {
    try {
      return fileURLToPath(new URL(raw));
    } catch {
      return path.join(
        /* turbopackIgnore: true */ process.cwd(),
        "dev.db",
      );
    }
  }
  const p = afterScheme.replace(/^\.\//, "");
  if (path.isAbsolute(p)) return p;
  return path.join(/* turbopackIgnore: true */ process.cwd(), p);
}

const dbFile = resolveSqliteDatabasePath();

function createAdapter() {
  return new PrismaBetterSqlite3({ url: dbFile });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(),
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

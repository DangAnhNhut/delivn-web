import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

function readLocalDatabaseUrl(): string | undefined {
  try {
    const contents = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
    const line = contents.split(/\r?\n/).find((entry) => entry.startsWith("DATABASE_URL="));
    if (!line) return undefined;
    const value = line.slice("DATABASE_URL=".length).trim();
    return value.replace(/^(['"])(.*)\1$/, "$2") || undefined;
  } catch {
    return undefined;
  }
}

// Next intentionally skips .env.local in test mode; pass only the private DB URL to workers.
const databaseUrl = process.env.DATABASE_URL ?? readLocalDatabaseUrl();

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    ...(databaseUrl ? { env: { DATABASE_URL: databaseUrl } } : {}),
  },
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Better Auth route boundary", () => {
  it("uses the official Next.js handler on Node runtime", () => {
    const source = readFileSync(new URL("./[...all]/route.ts", import.meta.url), "utf8");
    expect(source).toContain('toNextJsHandler(auth)');
    expect(source).toContain('runtime = "nodejs"');
    expect(source).toMatch(/export const \{ GET, POST \}/);
  });

  it("keeps browser auth code free of server/database imports", () => {
    const source = readFileSync(new URL("../../../lib/auth/auth-client.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/server\/|drizzle|pg|repositories|database/);
  });
});

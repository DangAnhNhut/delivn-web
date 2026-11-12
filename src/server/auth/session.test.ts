import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("./auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

import { getSessionFromHeaders, requirePageSession } from "./session";

const session = { user: { id: "00000000-0000-4000-8000-000000000001", name: "A", email: "a@example.com", emailVerified: false, image: null, createdAt: new Date(), updatedAt: new Date() }, session: { id: "s", userId: "u", token: "t", expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(), ipAddress: null, userAgent: null } } as never;

describe("session helpers", () => {
  it("returns complete session and preserves null", async () => {
    expect(await getSessionFromHeaders(new Headers(), { getSession: vi.fn().mockResolvedValue(session) })).toBe(session);
    expect(await getSessionFromHeaders(new Headers(), { getSession: vi.fn().mockResolvedValue(null) })).toBeNull();
  });
  it("propagates auth infrastructure errors", async () => {
    await expect(getSessionFromHeaders(new Headers(), { getSession: vi.fn().mockRejectedValue(new Error("db")) })).rejects.toThrow("db");
  });
  it("redirects only an anonymous page request with sanitized returnTo", async () => {
    await expect(requirePageSession("//evil.test", async () => null)).rejects.toThrow("NEXT_REDIRECT:/tai-khoan/dang-nhap?returnTo=%2Ftai-khoan");
    expect(await requirePageSession("/tai-khoan", async () => session)).toBe(session);
  });
});

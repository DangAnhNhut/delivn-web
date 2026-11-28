import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, SECURITY_HEADERS } from "./headers";

describe("security headers configuration", () => {
  it("defines required defensive headers without duplicating edge HSTS", () => {
    const headerMap = new Map(SECURITY_HEADERS.map((h) => [h.key, h.value]));

    expect(headerMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headerMap.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headerMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headerMap.get("Permissions-Policy")).toContain("camera=()");
    expect(headerMap.get("Permissions-Policy")).toContain("microphone=()");
    expect(headerMap.get("Permissions-Policy")).toContain("geolocation=()");
    expect(headerMap.has("Strict-Transport-Security")).toBe(false);
  });

  it("builds a Report-Only CSP that avoids unsafe-eval and wildcards while supporting 3D and PDF.js", () => {
    const headerMap = new Map(SECURITY_HEADERS.map((h) => [h.key, h.value]));
    const csp = buildContentSecurityPolicy();

    expect(headerMap.get("Content-Security-Policy-Report-Only")).toBe(csp);
    expect(headerMap.has("Content-Security-Policy")).toBe(false);

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain(" *");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("'wasm-unsafe-eval'");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("img-src 'self' blob: data:");
    expect(csp).toContain("form-action 'self' https://accounts.google.com");
  });
});


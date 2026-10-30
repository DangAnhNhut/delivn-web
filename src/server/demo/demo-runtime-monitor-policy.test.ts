import { describe, expect, it } from "vitest";

import { isIgnorableAllowedResponseConsoleError } from "./demo-runtime-monitor-policy";

describe("runtime monitor console policy", () => {
  const chromium409 = "Failed to load resource: the server responded with a status of 409 (Conflict)";

  it("ignores Chromium's generic resource error only after the allowed status was observed", () => {
    expect(isIgnorableAllowedResponseConsoleError(chromium409, new Set([409]))).toBe(true);
    expect(isIgnorableAllowedResponseConsoleError(chromium409, new Set())).toBe(false);
  });

  it("does not hide unrelated console errors or unallowed statuses", () => {
    expect(isIgnorableAllowedResponseConsoleError("Hydration failed", new Set([409]))).toBe(false);
    expect(
      isIgnorableAllowedResponseConsoleError(
        "Failed to load resource: the server responded with a status of 500 (Internal Server Error)",
        new Set([409]),
      ),
    ).toBe(false);
  });
});

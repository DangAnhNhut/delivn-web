import { describe, expect, it } from "vitest";
import { isVerifiedGoogleProfile } from "./google-profile";

describe("isVerifiedGoogleProfile", () => {
  it("admits only literal boolean true", () => {
    expect(isVerifiedGoogleProfile({ email_verified: true })).toBe(true);
    for (const value of [false, "true", 1, null, undefined]) {
      expect(isVerifiedGoogleProfile({ email_verified: value })).toBe(false);
    }
    expect(isVerifiedGoogleProfile(null)).toBe(false);
  });
});

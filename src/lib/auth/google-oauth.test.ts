import { describe, expect, it } from "vitest";

import {
  buildGoogleOAuthErrorCallback,
  hasGoogleOAuthCallbackError,
} from "./google-oauth";

describe("Google OAuth presentation helpers", () => {
  it("builds a login error callback that preserves a safe checkout return path", () => {
    expect(buildGoogleOAuthErrorCallback("login", "/thanh-toan"))
      .toBe("/tai-khoan/dang-nhap?oauthError=1&returnTo=%2Fthanh-toan");
  });

  it("builds a registration error callback and rejects external or malformed return paths", () => {
    expect(buildGoogleOAuthErrorCallback("register", "https://evil.example"))
      .toBe("/tai-khoan/dang-ky?oauthError=1&returnTo=%2Ftai-khoan");
    expect(buildGoogleOAuthErrorCallback("login", "/%0d%0aevil"))
      .toBe("/tai-khoan/dang-nhap?oauthError=1&returnTo=%2Ftai-khoan");
  });

  it("recognizes provider and explicit callback errors without interpreting raw details", () => {
    expect(hasGoogleOAuthCallbackError({ error: "access_denied" })).toBe(true);
    expect(hasGoogleOAuthCallbackError({ oauthError: "1" })).toBe(true);
    expect(hasGoogleOAuthCallbackError({ error_description: "raw provider payload" })).toBe(false);
    expect(hasGoogleOAuthCallbackError({})).toBe(false);
  });
});

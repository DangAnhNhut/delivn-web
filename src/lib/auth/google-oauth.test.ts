import { describe, expect, it } from "vitest";

import {
  buildGoogleOAuthErrorCallback,
  GOOGLE_ACCOUNT_NOT_LINKED_MESSAGE,
  GOOGLE_LINK_DEFAULT_ERROR_MESSAGE,
  GOOGLE_LINK_ERROR_MESSAGES,
  GOOGLE_OAUTH_ERROR_MESSAGE,
  hasGoogleOAuthCallbackError,
  resolveAccountLinkErrorMessage,
  resolveGoogleOAuthErrorMessage,
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

  it("resolves friendly login guidance when implicit linking is blocked for unverified password account", () => {
    expect(resolveGoogleOAuthErrorMessage({ error: "account_not_linked" }))
      .toBe(GOOGLE_ACCOUNT_NOT_LINKED_MESSAGE);
    expect(resolveGoogleOAuthErrorMessage({ error: "account not linked" }))
      .toBe(GOOGLE_ACCOUNT_NOT_LINKED_MESSAGE);
    expect(resolveGoogleOAuthErrorMessage({ oauthError: "1" }))
      .toBe(GOOGLE_OAUTH_ERROR_MESSAGE);
    expect(resolveGoogleOAuthErrorMessage({ error: "access_denied" }))
      .toBe(GOOGLE_OAUTH_ERROR_MESSAGE);
    expect(resolveGoogleOAuthErrorMessage({})).toBeNull();
  });

  it("resolves user-friendly account-link error messages without technical internals", () => {
    expect(resolveAccountLinkErrorMessage({ error: "email_does_not_match" }))
      .toBe(GOOGLE_LINK_ERROR_MESSAGES.email_does_not_match);
    expect(resolveAccountLinkErrorMessage({ error: "account_already_linked_to_different_user" }))
      .toBe(GOOGLE_LINK_ERROR_MESSAGES.account_already_linked_to_different_user);
    expect(resolveAccountLinkErrorMessage({ error: "unverified_google_email" }))
      .toBe(GOOGLE_LINK_ERROR_MESSAGES.unverified_google_email);
    expect(resolveAccountLinkErrorMessage({ error: "access_denied" }))
      .toBe(GOOGLE_LINK_ERROR_MESSAGES.access_denied);
    expect(resolveAccountLinkErrorMessage({ error: "unknown_internal_code" }))
      .toBe(GOOGLE_LINK_DEFAULT_ERROR_MESSAGE);
    expect(resolveAccountLinkErrorMessage({ linkError: "1" }))
      .toBe(GOOGLE_LINK_DEFAULT_ERROR_MESSAGE);
    expect(resolveAccountLinkErrorMessage({})).toBeNull();
  });
});

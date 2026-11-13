import type { BetterAuthOptions } from "better-auth";
import type { AuthEnvironment } from "./auth-environment";
import { isVerifiedGoogleProfile } from "./google-profile";

export function createAuthOptions(environment: AuthEnvironment): BetterAuthOptions {
  return {
    secret: environment.secret,
    baseURL: environment.baseURL,
    advanced: { database: { generateId: "uuid" } },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
    },
    account: {
      accountLinking: {
        allowDifferentEmails: false,
        requireLocalEmailVerified: false,
      },
    },
    socialProviders: environment.google
      ? { google: { clientId: environment.google.clientId, clientSecret: environment.google.clientSecret } }
      : {},
    user: {
      validateUserInfo({ source }) {
        if (source.oauth?.providerId === "google" && !isVerifiedGoogleProfile(source.oauth.profile)) {
          return { error: "unverified_google_email", errorDescription: "Google email must be verified" };
        }
      },
    },
  };
}

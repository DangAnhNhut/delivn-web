# Google OAuth setup

DELIVN uses Better Auth 1.7.17 and the minimum Google identity scopes required for sign-in. Keep credentials environment-specific and never commit them.

## Environment

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BETTER_AUTH_URL` (the exact public application origin)

Configure both Google variables or neither. Values are trimmed, whitespace-only values count as absent, the provider is hidden when both are absent, and configuration fails closed when only one non-empty value exists.

Use these Google Cloud Web application values:

- authorized JavaScript origins: `http://localhost:3000` and `https://delivn.com.vn`;
- authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://delivn.com.vn/api/auth/callback/google`.

Production must use `BETTER_AUTH_URL=https://delivn.com.vn`; do not register `www.delivn.com.vn` or arbitrary preview URLs for this production OAuth client. The provider explicitly requests only `openid`, `email`, and `profile`.

Configure the Google consent screen and authorized origin/callback for each environment. Google profiles must assert `email_verified: true`; matching verified email may link to the existing DELIVN identity, different email remains separate, and an unverified profile is rejected. Do not add `trustedProviders: ["google"]` as a shortcut.

DELIVN does not yet provide email-verification delivery for password accounts. Therefore implicit same-email linking requires both a verified Google profile and an already-verified local identity (`requireLocalEmailVerified: true`). A typical unverified password account is not silently joined to Google; this prevents pre-registration account hijacking. Google-only users and previously linked Google identities can sign in normally. `allowDifferentEmails` remains `false`, and `trustedProviders` is not configured.

Under Option B account-linking policy, customers with an unverified password account sign in using their email/password and navigate to the authenticated account page (`/tai-khoan`). The customer explicitly links Google using the Better Auth `linkSocial` flow (`authClient.linkSocial`). Google identity must have `email_verified === true` matching the DELIVN account email (`allowDifferentEmails: false`). Linking preserves the existing user UUID, attaches the Google provider row without duplicating user accounts, and maintains existing order ownership. Password login and Google login both remain valid for the linked identity.

Real Google OAuth is a manual smoke test only when approved credentials exist; normal CI mocks provider boundaries and must not contact Google. The smoke test must cover consent cancellation, successful account/session creation, logout, safe checkout return, and byte-for-byte preservation of `delivn.cart.v1`.

Better Auth's global OAuth callback failures (including invalid or missing state before a per-attempt callback can be recovered) return to the internal DELIVN login error state. The UI deliberately ignores provider descriptions and shows only generic Vietnamese guidance.

# Google OAuth setup

DELIVN uses Better Auth 1.7.17 and the minimum Google identity scopes required for sign-in. Keep credentials environment-specific and never commit them.

## Environment

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BETTER_AUTH_URL` (the exact public application origin)

Configure both Google variables or neither. Local callback: `http://127.0.0.1:3000/api/auth/callback/google`. Production callback: `${BETTER_AUTH_URL}/api/auth/callback/google`.

Configure the Google consent screen and authorized origin/callback for each environment. Google profiles must assert `email_verified: true`; matching verified email may link to the existing DELIVN identity, different email remains separate, and an unverified profile is rejected. Do not add `trustedProviders: ["google"]` as a shortcut.

DELIVN intentionally has no email-delivery verification flow in this phase, so local email/password users remain unverified in Better Auth. `requireLocalEmailVerified: false` is therefore required for a verified matching Google identity to link to that existing credential account. This does not relax the provider boundary: Google must still return literal `email_verified: true`, `allowDifferentEmails` remains `false`, and unverified or different-email identities are never forced onto an existing account.

Real Google OAuth is a manual smoke test only when approved credentials exist; normal CI mocks provider boundaries and must not contact Google.

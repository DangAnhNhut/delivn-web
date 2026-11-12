# Production authentication checklist

- Confirm `better-auth` and Better Auth companion packages remain pinned to 1.7.17; review migration SQL before applying it.
- Back up the database; verify nullable historical `orders.user_id` remains unbackfilled and rollback is available.
- Set a strong rotated `BETTER_AUTH_SECRET` and the exact HTTPS `BETTER_AUTH_URL`.
- Verify secure, HttpOnly, SameSite cookie behavior and full database-session authorization for pages and APIs.
- Configure the production Google consent screen and exact callback; never reuse local credentials.
- Re-run negative IDOR checks: owned order succeeds; foreign and nonexistent order numbers return identical not-found behavior.
- Confirm cookie cache/stateless authorization remains disabled and secrets/customer PII are not logged or persisted in browser storage.
- Keep Better Auth timestamp columns as PostgreSQL `timestamp with time zone`. Local PostgreSQL and Node may use different time zones; timezone-free session expiry values can otherwise be interpreted as still valid. Re-run the durable expired-session integration regression after any auth-schema change.
- Preserve the reviewed linking policy: `requireLocalEmailVerified: false` only because DELIVN has no local verification delivery, while Google `email_verified: true`, `allowDifferentEmails: false`, and the absence of a `trustedProviders` shortcut remain mandatory.
- On Vercel, measure the actual client-IP and forwarded-header behavior before configuring `ipAddressHeaders`, `trustedProxies`, or `advanced.trustedProxyHeaders`. Never assume client-supplied forwarded headers are trustworthy.
- Validate Better Auth rate limiting behind Vercel proxies and across serverless instances before launch; document the resulting trusted-header configuration.

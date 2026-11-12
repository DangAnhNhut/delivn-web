export type AuthEnvironment = {
  secret: string;
  baseURL: string;
  google: { clientId: string; clientSecret: string } | null;
};

const INSECURE_PLACEHOLDER_PATTERN =
  /(?:change[-_]?me|replace[-_]?me|your[-_]?secret|better[-_]?auth[-_]?secret|development[-_]?secret|test[-_]?secret|placeholder|example[-_]?secret)/i;

export function isPlaceholderSecret(secret: string): boolean {
  return INSECURE_PLACEHOLDER_PATTERN.test(secret);
}

export function resolveAuthEnvironment(
  environment: Record<string, string | undefined>,
): AuthEnvironment {
  const secret = environment.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");
  }
  if (isPlaceholderSecret(secret)) {
    throw new Error("BETTER_AUTH_SECRET must not use a placeholder or insecure development value");
  }

  const baseURL = environment.BETTER_AUTH_URL;
  try {
    const parsed = new URL(baseURL ?? "");
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    throw new Error("BETTER_AUTH_URL must be an absolute HTTP(S) URL");
  }

  const clientId = environment.GOOGLE_CLIENT_ID;
  const clientSecret = environment.GOOGLE_CLIENT_SECRET;
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new Error(clientId ? "GOOGLE_CLIENT_SECRET is required" : "GOOGLE_CLIENT_ID is required");
  }

  return {
    secret,
    baseURL: baseURL!,
    google: clientId && clientSecret ? { clientId, clientSecret } : null,
  };
}

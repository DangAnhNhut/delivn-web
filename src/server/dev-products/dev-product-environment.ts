export type DevProductEnvironment = {
  databaseUrl: string;
  databaseName: "delivn_dev";
};

type Environment = Record<string, string | undefined>;

export class DevProductEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DevProductEnvironmentError";
  }
}

export function loadDevProductEnvironment(environment: Environment): DevProductEnvironment {
  if (environment.NODE_ENV === "production") {
    throw new DevProductEnvironmentError("Persistent development products are disabled in production.");
  }

  const databaseUrl = environment.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new DevProductEnvironmentError("DATABASE_URL is required for persistent development products.");
  }

  let target: URL;
  try {
    target = new URL(databaseUrl);
  } catch {
    throw new DevProductEnvironmentError("DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (target.protocol !== "postgresql:" && target.protocol !== "postgres:") {
    throw new DevProductEnvironmentError("DATABASE_URL must use the PostgreSQL protocol.");
  }

  for (const key of target.searchParams.keys()) {
    if (key !== "sslmode") {
      throw new DevProductEnvironmentError(`DATABASE_URL query parameter ${key} is not allowed.`);
    }
  }

  const hostname = target.hostname.toLowerCase();
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    throw new DevProductEnvironmentError("DATABASE_URL must use a loopback hostname.");
  }
  if (target.pathname !== "/delivn_dev") {
    throw new DevProductEnvironmentError("DATABASE_URL must target delivn_dev exactly.");
  }

  return { databaseName: "delivn_dev", databaseUrl };
}

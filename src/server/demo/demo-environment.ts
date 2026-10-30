export type DemoEnvironment = {
  databaseUrl: string;
  databaseName: "delivn_e2e";
};

type Environment = Record<string, string | undefined>;

function parsePostgresUrl(value: string, label: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL URL.`);
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`${label} must use the PostgreSQL protocol.`);
  }

  return parsed;
}

function databaseIdentity(url: URL): string {
  const queryHost = url.searchParams.getAll("host").at(-1);
  const queryPort = url.searchParams.getAll("port").at(-1);
  const rawHost = (queryHost ?? url.hostname).toLowerCase();
  const host = rawHost === "localhost" || rawHost === "127.0.0.1" ? "loopback" : rawHost;
  const port = queryPort || url.port || "5432";
  return `${host}:${port}${url.pathname}`;
}

export function loadDemoEnvironment(environment: Environment): DemoEnvironment {
  if (environment.NODE_ENV === "production") {
    throw new Error("Development demo data is disabled in production.");
  }

  if (environment.DELIVN_ENABLE_DEMO_SEED !== "true") {
    throw new Error("DELIVN_ENABLE_DEMO_SEED must be exactly true.");
  }

  const databaseUrl = environment.DELIVN_E2E_DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DELIVN_E2E_DATABASE_URL is required.");
  }

  const target = parsePostgresUrl(databaseUrl, "DELIVN_E2E_DATABASE_URL");
  for (const key of target.searchParams.keys()) {
    if (key !== "sslmode") {
      throw new Error(`DELIVN_E2E_DATABASE_URL query parameter ${key} is not allowed.`);
    }
  }
  if (target.hostname !== "127.0.0.1" && target.hostname !== "localhost") {
    throw new Error("DELIVN_E2E_DATABASE_URL must use a loopback hostname.");
  }
  if (target.pathname !== "/delivn_e2e") {
    throw new Error("DELIVN_E2E_DATABASE_URL must target delivn_e2e exactly.");
  }

  const ordinaryUrl = environment.DATABASE_URL?.trim();
  if (ordinaryUrl) {
    const ordinary = parsePostgresUrl(ordinaryUrl, "DATABASE_URL");
    if (databaseIdentity(target) === databaseIdentity(ordinary)) {
      throw new Error("The E2E target must not resolve to the ordinary DATABASE_URL database.");
    }
  }

  return { databaseName: "delivn_e2e", databaseUrl };
}

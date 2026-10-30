import { loadDemoEnvironment } from "./demo-environment";

const BASE_URL = "http://127.0.0.1:3100";
type DemoBrowserChannel = "chrome" | "msedge";

function resolveBrowserChannel(value: string | undefined): DemoBrowserChannel | undefined {
  if (value === undefined) return undefined;
  if (value === "chrome" || value === "msedge") return value;
  throw new Error("DELIVN_E2E_BROWSER_CHANNEL must be either chrome or msedge when set.");
}

export function resolveDemoPlaywrightConfig(environment: Record<string, string | undefined>) {
  const demo = loadDemoEnvironment(environment);
  const browserChannel = resolveBrowserChannel(environment.DELIVN_E2E_BROWSER_CHANNEL);
  const inheritedEnvironment = Object.fromEntries(
    Object.entries(environment).filter(
      (entry): entry is [string, string] =>
        entry[0] !== "DELIVN_E2E_BROWSER_CHANNEL" && typeof entry[1] === "string",
    ),
  );
  const webServerEnvironment: Record<string, string | undefined> = {
    ...inheritedEnvironment,
    DATABASE_URL: demo.databaseUrl,
  };

  if (browserChannel) {
    // Playwright merges process.env before these overrides. Node omits an
    // undefined value when spawning the Next.js child, while workers retain the
    // original channel from the runner environment.
    webServerEnvironment.DELIVN_E2E_BROWSER_CHANNEL = undefined;
  }

  return {
    baseURL: BASE_URL,
    databaseUrl: demo.databaseUrl,
    ...(browserChannel ? { browserChannel } : {}),
    webServer: {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
      env: webServerEnvironment,
      reuseExistingServer: false,
      url: BASE_URL,
    },
  };
}

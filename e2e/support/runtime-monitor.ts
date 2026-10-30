import { expect, type Page } from "@playwright/test";

import { isIgnorableAllowedResponseConsoleError } from "../../src/server/demo/demo-runtime-monitor-policy";

type AllowedResponse = { path: string; status: number };

export function monitorRuntime(page: Page, allowedResponses: readonly AllowedResponse[] = []) {
  const issues: string[] = [];
  const consoleErrors: string[] = [];
  const observedAllowedStatuses = new Set<number>();
  const isSameOrigin = (rawUrl: string) => {
    const url = new URL(rawUrl);
    return url.hostname === "127.0.0.1" && url.port === "3100";
  };

  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (!isSameOrigin(request.url())) return;
    const failure = request.failure()?.errorText ?? "unknown failure";
    if (failure === "net::ERR_ABORTED" && new URL(request.url()).pathname.startsWith("/_next/")) return;
    issues.push(`requestfailed: ${request.method()} ${request.url()} (${failure})`);
  });
  page.on("response", (response) => {
    if (!isSameOrigin(response.url()) || response.status() < 400) return;
    const url = new URL(response.url());
    const allowed = allowedResponses.some(
      (entry) => entry.path === url.pathname && entry.status === response.status(),
    );
    if (allowed) observedAllowedStatuses.add(response.status());
    else issues.push(`response: ${response.status()} ${url.pathname}`);
  });

  return {
    assertClean() {
      const unexpectedConsoleErrors = consoleErrors
        .filter(
          (message) =>
            !isIgnorableAllowedResponseConsoleError(message, observedAllowedStatuses),
        )
        .map((message) => `console: ${message}`);
      const allIssues = [...issues, ...unexpectedConsoleErrors];
      expect(allIssues, allIssues.join("\n")).toEqual([]);
    },
  };
}

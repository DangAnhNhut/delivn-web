export function isIgnorableAllowedResponseConsoleError(
  message: string,
  observedAllowedStatuses: ReadonlySet<number>,
): boolean {
  for (const status of observedAllowedStatuses) {
    if (
      message.startsWith(
        `Failed to load resource: the server responded with a status of ${status}`,
      )
    ) {
      return true;
    }
  }
  return false;
}

export function isIgnorableCancelledRscRequest(
  method: string,
  rawUrl: string,
  failure: string,
): boolean {
  if (method !== "GET" || failure !== "net::ERR_ABORTED") return false;
  return new URL(rawUrl).searchParams.has("_rsc");
}

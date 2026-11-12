function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.startsWith("/") && !decoded.startsWith("//") && !/[\\\u0000-\u001f\u007f]/.test(decoded);
  } catch {
    return false;
  }
}

export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback: string,
): string {
  if (value && isSafeInternalPath(value)) return value;
  return isSafeInternalPath(fallback) ? fallback : "/";
}

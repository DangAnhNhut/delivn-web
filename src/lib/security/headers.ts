export type SecurityHeaderEntry = {
  key: string;
  value: string;
};

/**
 * Builds the Content-Security-Policy header based on verified DELIVN storefront dependencies:
 * - Self-hosted Next.js fonts and assets ('self')
 * - Three.js / GLTFLoader embedded textures & fetches (blob:, data:)
 * - PDF.js worker (/pdfjs/pdf.worker.min.mjs) and WebAssembly (/pdfjs/wasm/, 'wasm-unsafe-eval')
 * - Next.js static prerendered hydration scripts ('unsafe-inline') and React inline styles ('unsafe-inline')
 * - Google OAuth form/navigation flow (https://accounts.google.com)
 * Note: 'unsafe-eval' is intentionally excluded.
 */
export function buildContentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'self'",
    "object-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self' blob: data:",
    "worker-src 'self' blob:",
  ].join("; ");
}

export const SECURITY_HEADERS: readonly SecurityHeaderEntry[] = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: buildContentSecurityPolicy(),
  },
];


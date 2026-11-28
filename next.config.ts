import type { NextConfig } from "next";

import { SECURITY_HEADERS } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS.map((header) => ({ ...header })),
      },
    ];
  },
};

export default nextConfig;

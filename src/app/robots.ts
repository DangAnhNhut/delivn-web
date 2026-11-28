import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/tai-khoan", "/thanh-toan", "/api/"],
      },
    ],
    sitemap: "https://delivn.com.vn/sitemap.xml",
  };
}


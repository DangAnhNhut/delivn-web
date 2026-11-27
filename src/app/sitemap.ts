import type { MetadataRoute } from "next";
import { LEGAL_ROUTE_LINKS } from "@/data/legal";

const BASE_URL = "https://delivn.com.vn";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "/",
    "/san-pham",
    "/san-pham/ca-phe-hat-rang-espresso",
    "/san-pham/ca-phe-rang-xay",
    "/ban-tu-cong-bo-san-pham",
    ...LEGAL_ROUTE_LINKS.map((item) => item.href),
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}


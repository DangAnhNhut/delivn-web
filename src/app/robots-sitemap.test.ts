import { describe, expect, it } from "vitest";

import robots from "./robots";
import sitemap from "./sitemap";

describe("robots and sitemap metadata routes", () => {
  it("configures robots.txt with public allow, private disallow, and sitemap URL", () => {
    const config = robots();
    const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rule?.allow).toBe("/");
    expect(rule?.disallow).toEqual(["/tai-khoan", "/thanh-toan", "/api/"]);
    expect(config.sitemap).toBe("https://delivn.com.vn/sitemap.xml");
  });

  it("publishes canonical https://delivn.com.vn routes in sitemap without private URLs", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://delivn.com.vn/");
    expect(urls).toContain("https://delivn.com.vn/san-pham");
    expect(urls).toContain("https://delivn.com.vn/ban-tu-cong-bo-san-pham");
    for (const url of urls) {
      expect(url.startsWith("https://delivn.com.vn")).toBe(true);
      expect(url).not.toMatch(/\/tai-khoan|\/thanh-toan|\/api\//);
    }
  });
});


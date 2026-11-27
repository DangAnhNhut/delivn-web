import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SocialConnection } from "./SocialConnection";
import { CONTACT_CHANNELS } from "@/data/contact";

describe("SocialConnection", () => {
  it("renders all 5 channels in exact order and reuses official URLs without fake hrefs", () => {
    const html = renderToStaticMarkup(createElement(SocialConnection));

    expect(html).toContain("KÊNH KẾT NỐI");

    const expectedOrder = ["facebook", "instagram", "youtube", "tiktok-shop", "shopee"];
    const positions = expectedOrder.map((id) =>
      html.indexOf(`data-channel-id="${id}"`)
    );
    for (let i = 0; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(-1);
      if (i > 0) {
        expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
      }
    }

    const activeSocial = CONTACT_CHANNELS.filter(
      (c) => c.group === "social" && c.status === "active"
    );
    for (const channel of activeSocial) {
      expect(html).toContain(`href="${channel.href}"`);
    }

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('href="#"');
    expect(html).not.toContain("online.gov.vn");
  });
});

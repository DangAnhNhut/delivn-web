import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ContactHub } from "./ContactHub";
import { CONTACT_CHANNELS } from "@/data/contact";

const expectedActiveChannels = {
  youtube: "https://www.youtube.com/channel/UCsMjU0JedzxRGd3h1YBf_Fw",
  instagram: "https://www.instagram.com/delivncoffee/",
  facebook: "https://www.facebook.com/delivncoffee",
} as const;

describe("DELIVN contact hub", () => {
  it("centralizes exact active links and keeps pending shops URL-free", () => {
    for (const [id, href] of Object.entries(expectedActiveChannels)) {
      expect(CONTACT_CHANNELS.find((channel) => channel.id === id)).toMatchObject({
        id,
        status: "active",
        href,
      });
    }

    for (const id of ["tiktok-shop", "shopee"]) {
      const channel = CONTACT_CHANNELS.find((entry) => entry.id === id);
      expect(channel).toMatchObject({ id, status: "pending" });
      expect(channel).not.toHaveProperty("href");
    }
  });

  it("renders a compact connection-first introduction and exact platform identity", () => {
    const html = renderToStaticMarkup(createElement(ContactHub));

    expect(html).toContain(">LIÊN HỆ<");
    expect(html).toContain(">KẾT NỐI VỚI DELIVN<");
    expect(html).toContain(
      "Theo dõi DELIVN trên các kênh chính thức và nền tảng mua sắm trực tuyến.",
    );
    expect(html).not.toContain("KẾT NỐI VỚI DELIVN.");
    expect(html).not.toContain("LIÊN HỆ DELIVN");
    expect(html).not.toContain("THÔNG TIN DOANH NGHIỆP");
    expect(html).not.toContain("THÔNG TIN LIÊN QUAN");
    expect(html).not.toContain("CÔNG TY TNHH CÀ PHÊ DELIVN");
    expect(html).not.toContain("3703119501");
    expect(html).not.toContain("ĐẠI DIỆN THEO PHÁP LUẬT");
    expect(html).not.toContain("href=\"tel:");

    for (const [id, href] of Object.entries(expectedActiveChannels)) {
      expect(html).toContain(`data-channel-id="${id}"`);
      expect(html).toContain(`href="${href}"`);
    }
    expect(html.match(/target="_blank"/g)).toHaveLength(3);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(3);

    for (const platform of ["YouTube", "Instagram", "Facebook", "TikTok Shop", "Shopee"]) {
      expect(html).toContain(`alt="${platform}`);
    }
    expect(html.match(/ĐANG CẬP NHẬT/g)).toHaveLength(2);
  });

  it("renders pending marketplace cards as non-links without fabricated contact data", () => {
    const html = renderToStaticMarkup(createElement(ContactHub));
    const tiktokCard = html.match(/<[^>]+data-channel-id="tiktok-shop"[\s\S]*?<\/[^>]+>/)?.[0];
    const shopeeCard = html.match(/<[^>]+data-channel-id="shopee"[\s\S]*?<\/[^>]+>/)?.[0];

    expect(tiktokCard).toBeTruthy();
    expect(shopeeCard).toBeTruthy();
    expect(tiktokCard).not.toContain("href=");
    expect(shopeeCard).not.toContain("href=");
    expect(html).not.toMatch(/mailto:|@[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(html).not.toContain("Bình Dương");
    expect(html).not.toMatch(/CMND|CCCD|ngày sinh|giấy chứng nhận đăng ký/i);
  });
});

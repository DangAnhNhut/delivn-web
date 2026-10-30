import { expect, test } from "@playwright/test";

import { DEMO_PRODUCTS } from "../src/server/demo/demo-data";
import { addEspresso250ToCart } from "./support/commerce-flow";
import { monitorRuntime } from "./support/runtime-monitor";

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "laptop-1024", width: 1024, height: 900 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
] as const;

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const viewport of viewports) {
  test(`${viewport.name} keeps catalog, PDP, cart, and checkout usable`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const runtime = monitorRuntime(page);

    await page.goto("/san-pham");
    await expect(page.getByRole("heading", { name: DEMO_PRODUCTS[0].name })).toBeVisible();
    const catalogImage = page.getByAltText(/Bao bì Espresso màu đen dùng cho dữ liệu demo/).first();
    await expect(catalogImage).toBeVisible();
    expect(await catalogImage.evaluate((image: HTMLImageElement) => image.naturalWidth > 0)).toBe(true);
    await expectNoHorizontalOverflow(page);

    await addEspresso250ToCart(page);
    await expect(page.getByRole("button", { name: /THÊM VÀO GIỎ|ĐÃ ĐẠT GIỚI HẠN/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/gio-hang");
    await expect(page.getByRole("link", { name: /TIẾP TỤC THANH TOÁN/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/thanh-toan");
    await expect(page.getByRole("button", { name: "ĐẶT HÀNG" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    runtime.assertClean();

    await testInfo.attach(`${viewport.name}-checkout`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}

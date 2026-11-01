import { expect, test } from "@playwright/test";

import { DEMO_PRODUCTS } from "../src/server/demo/demo-data";
import { resetDemoData } from "./support/demo-db";
import { monitorRuntime } from "./support/runtime-monitor";

const viewports = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "laptop-1024", width: 1024, height: 768 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-390", width: 390, height: 844 },
] as const;

test.describe("Storefront Product UX - Direct Purchase Flow", () => {
  test.beforeEach(async () => {
    await resetDemoData();
  });

  test("catalog removes redundant hero, displays approved single images, neutral copy, and dual CTAs", async ({
    page,
  }) => {
    const runtime = monitorRuntime(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/san-pham");

    // 1. Redundant hero must NOT exist
    await expect(
      page.getByRole("heading", { name: /Chọn gu cà phê.*phù hợp với bạn/i }),
    ).toHaveCount(0);
    await expect(page.locator("text=Khám phá sản phẩm ↓")).toHaveCount(0);

    // 2. Direct catalog heading
    await expect(
      page.getByRole("heading", { level: 1, name: /CÀ PHÊ DELIVN/i }),
    ).toBeVisible();

    // 3. Both product cards visible above reasonable scroll depth
    const espressoCard = page
      .getByRole("article")
      .filter({ hasText: DEMO_PRODUCTS[0].name });
    const rangXayCard = page
      .getByRole("article")
      .filter({ hasText: DEMO_PRODUCTS[1].name });

    await expect(espressoCard).toBeVisible();
    await expect(rangXayCard).toBeVisible();

    const espressoBox = await espressoCard.boundingBox();
    const rangXayBox = await rangXayCard.boundingBox();
    expect(espressoBox?.y).toBeLessThan(700);
    expect(rangXayBox?.y).toBeLessThan(700);

    // 4. Approved single reference images (no carousel)
    const espressoImg = espressoCard.locator("img");
    await expect(espressoImg).toHaveCount(1);
    const espressoSrc = await espressoImg.getAttribute("src");
    expect(decodeURIComponent(espressoSrc ?? "")).toContain(
      "/products/reference/500g_black_reference.jpg",
    );

    const rangXayImg = rangXayCard.locator("img");
    await expect(rangXayImg).toHaveCount(1);
    const rangXaySrc = await rangXayImg.getAttribute("src");
    expect(decodeURIComponent(rangXaySrc ?? "")).toContain(
      "/products/reference/500g_sand_reference.jpg",
    );

    // 5. No carousel controls (no next/prev arrows, no dots, no thumbnails)
    await expect(page.locator('button[aria-label*="tiếp theo"]')).toHaveCount(0);
    await expect(page.locator('button[aria-label*="trước"]')).toHaveCount(0);
    await expect(page.locator('[role="tablist"]')).toHaveCount(0);

    // 6. Primary CTA is MUA NGAY button, Secondary CTA is THÊM VÀO GIỎ button
    const buyNowBtn = espressoCard.getByRole("button", { name: "MUA NGAY" });
    const addToCartBtn = espressoCard.getByRole("button", { name: "THÊM VÀO GIỎ" });
    await expect(buyNowBtn).toBeVisible();
    await expect(addToCartBtn).toBeVisible();

    // 7. Old XEM CHI TIẾT is absent; no catalog link to PDP
    await expect(page.locator("text=/xem chi tiết/i")).toHaveCount(0);
    const cardLinks = espressoCard.locator("a");
    for (let i = 0; i < (await cardLinks.count()); i++) {
      const href = await cardLinks.nth(i).getAttribute("href");
      expect(href).not.toContain("/san-pham/");
    }

    // 8. Development copy absent; neutral factual copy displayed
    await expect(page.locator("text=Dữ liệu sản phẩm DELIVN dùng cho phát triển cục bộ")).toHaveCount(0);
    await expect(
      espressoCard.locator("text=Cà phê hạt rang — lựa chọn 250g hoặc 500g."),
    ).toBeVisible();
    await expect(
      rangXayCard.locator("text=Cà phê rang xay — lựa chọn 250g hoặc 500g."),
    ).toBeVisible();

    // 9. Variant toggle on card updates displayed price immediately
    await expect(espressoCard.getByText("173.000 ₫")).toBeVisible();
    await espressoCard.getByRole("radio", { name: "500g" }).click();
    await expect(espressoCard.getByText("345.000 ₫")).toBeVisible();

    // 10. Secondary action: THÊM VÀO GIỎ remains on /san-pham and updates count
    await addToCartBtn.click();
    await expect(espressoCard.getByText("ĐÃ THÊM VÀO GIỎ")).toBeVisible();
    await expect(page).toHaveURL(/\/san-pham$/);
    await expect(page.getByRole("link", { name: "GIỎ HÀNG (1)" }).first()).toBeVisible();

    runtime.assertClean();
  });

  test("MUA NGAY button on catalog card navigates directly to /thanh-toan", async ({
    page,
  }) => {
    const runtime = monitorRuntime(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/san-pham");
    const espressoCard = page
      .getByRole("article")
      .filter({ hasText: DEMO_PRODUCTS[0].name });

    await espressoCard.getByRole("radio", { name: "250g" }).click();
    await espressoCard.getByRole("button", { name: "MUA NGAY" }).click();

    await expect(page).toHaveURL(/\/thanh-toan$/);
    await expect(page.getByRole("heading", { level: 1, name: "HOÀN TẤT ĐƠN HÀNG." })).toBeVisible();

    runtime.assertClean();
  });

  for (const vp of viewports) {
    test(`responsive storefront check and visual QA capture at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const runtime = monitorRuntime(page);

      await page.goto("/san-pham");
      await expect(
        page.getByRole("heading", { level: 1, name: /CÀ PHÊ DELIVN/i }),
      ).toBeVisible();

      // Ensure no horizontal overflow
      const noCatalogOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(noCatalogOverflow).toBe(true);

      const artifactDir = "C:/Users/Admin/.gemini/antigravity-ide/brain/4cae4f7b-3c03-4295-9fe9-5cb125d0a53e/screenshots";
      const catalogPath = `${artifactDir}/catalog-${vp.name}.png`;
      const catalogScreenshot = await page.screenshot({ path: catalogPath, fullPage: true });
      await testInfo.attach(`catalog-${vp.name}`, {
        body: catalogScreenshot,
        contentType: "image/png",
      });

      runtime.assertClean();
    });
  }
});

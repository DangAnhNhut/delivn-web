import { expect, test } from "@playwright/test";

import { DEMO_PRODUCTS } from "../src/server/demo/demo-data";
import {
  acceptCheckoutTerms,
  expectPersistedEspresso250Order,
  fillCheckoutDetails,
} from "./support/commerce-flow";
import { resetDemoData } from "./support/demo-db";
import { monitorRuntime } from "./support/runtime-monitor";

test.use({ viewport: { width: 1440, height: 900 } });

async function revealFooterForScreenshot(page: import("@playwright/test").Page) {
  const footer = page.locator("#site-footer");
  await footer.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      footer
        .locator(".footer-inner")
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity)),
    )
    .toBeGreaterThan(0.99);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
}

test("homepage visitor completes the direct customer sales journey", async ({ page }, testInfo) => {
  await resetDemoData();
  const runtime = monitorRuntime(page);

  await page.goto("/");
  const homepageHero = page.getByRole("region", { name: "Giới thiệu DELIVN" });
  await expect(homepageHero).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: /CÀ PHÊ VIỆT.*TÂY NGUYÊN/i }),
  ).toBeVisible();

  await homepageHero.getByRole("link", { name: "CHỌN CÀ PHÊ CỦA BẠN" }).click();
  await expect(page).toHaveURL(/\/san-pham$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /CÀ PHÊ DELIVN/i }),
  ).toBeVisible();

  const catalogProduct = page
    .getByRole("article")
    .filter({ hasText: DEMO_PRODUCTS[0].name });
  await expect(catalogProduct).toBeVisible();
  await expect(catalogProduct).toContainText("CÀ PHÊ HẠT RANG ESPRESSO");
  await expect(catalogProduct).toContainText("250g");

  // Select Espresso 250g
  await catalogProduct.getByRole("radio", { name: /250g/i }).click();
  await expect(catalogProduct.getByText("173.000 ₫", { exact: true })).toBeVisible();

  // Direct purchase flow: MUA NGAY -> /thanh-toan
  await catalogProduct.getByRole("button", { name: "MUA NGAY" }).click();

  await expect(page).toHaveURL(/\/thanh-toan$/);
  await expect(page.getByRole("heading", { level: 1, name: "HOÀN TẤT ĐƠN HÀNG" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Thanh toán khi nhận hàng/i })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Chuyển khoản ngân hàng/i })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(2);
  for (const unsupportedMethod of ["VietQR", "MoMo", "ZaloPay", "VNPay"]) {
    await expect(page.getByText(unsupportedMethod, { exact: true })).toHaveCount(0);
  }

  const cod = page.getByRole("radio", { name: /Thanh toán khi nhận hàng/i });
  const bankTransfer = page.getByRole("radio", { name: /Chuyển khoản ngân hàng/i });
  await cod.check();
  await expect(page.locator("[data-bank-transfer-placeholder]")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("checkout-cod-desktop-1440.png"),
    fullPage: true,
  });

  await bankTransfer.check();
  const bankPlaceholder = page.locator("[data-bank-transfer-placeholder]");
  await expect(bankPlaceholder).toContainText("MÃ QR");
  await expect(bankPlaceholder).toContainText("ĐANG CẬP NHẬT");
  await expect(bankPlaceholder).toContainText("không thể quét");
  await page.screenshot({
    path: testInfo.outputPath("checkout-bank-transfer-desktop-1440.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("checkout-bank-transfer-mobile-390.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await cod.check();
  await expect(bankPlaceholder).toHaveCount(0);

  const province = page.getByRole("combobox", { name: /Tỉnh \/ thành phố/i });
  const commune = page.getByRole("combobox", { name: /Phường \/ xã \/ đặc khu/i });
  await expect(province).toBeVisible();
  await expect(commune).toBeDisabled();
  await expect(page.getByLabel(/Địa chỉ chi tiết/i)).toBeVisible();
  await expect(page.getByLabel(/Quận \/ huyện/i)).toHaveCount(0);
  await fillCheckoutDetails(page);

  await page.screenshot({
    path: testInfo.outputPath("checkout-address-desktop-1440.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("checkout-address-mobile-390.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });

  const termsCheckbox = page.getByRole("checkbox", {
    name: /Tôi đã đọc và đồng ý/i,
  });
  await expect(termsCheckbox).toBeVisible();
  await expect(termsCheckbox).not.toBeChecked();

  const checkoutRequests: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().endsWith("/api/checkout") &&
      request.method() === "POST"
    ) {
      checkoutRequests.push(request.url());
    }
  });

  await page.getByRole("button", { name: "ĐẶT HÀNG" }).click();
  await expect(page.locator("#checkout-terms-error")).toContainText(
    /cần đồng ý với điều khoản giao dịch/i,
  );
  expect(checkoutRequests).toHaveLength(0);

  await acceptCheckoutTerms(page);
  await expect(termsCheckbox).toBeChecked();

  const checkoutResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/checkout") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "ĐẶT HÀNG" }).click();
  const response = await checkoutResponse;
  expect(response.status()).toBe(201);

  await expect(
    page.getByRole("heading", { level: 1, name: "ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN" }),
  ).toBeVisible();
  const orderNumber = await page.getByText(/^DLV-\d{8}-\d{6}$/).textContent();
  expect(orderNumber).toBeTruthy();
  await expect(page.getByText("173.000 ₫", { exact: true })).toBeVisible();
  await expect(page.getByText("Thanh toán khi nhận hàng", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa thanh toán", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "GIỎ HÀNG (0)" }).first()).toBeVisible();

  await expectPersistedEspresso250Order(orderNumber!);
  runtime.assertClean();
});

test("catalog visitor can add to cart, remain on catalog, and view in cart", async ({
  page,
}, testInfo) => {
  await resetDemoData();
  const runtime = monitorRuntime(page);

  await page.goto("/san-pham");
  const catalogProduct = page
    .getByRole("article")
    .filter({ hasText: DEMO_PRODUCTS[0].name });
  await expect(catalogProduct).toBeVisible();

  // Choose 500g variant
  await catalogProduct.getByRole("radio", { name: /500g/i }).click();
  await expect(catalogProduct.getByText("345.000 ₫", { exact: true })).toBeVisible();

  // Add to cart
  await catalogProduct.getByRole("button", { name: "THÊM VÀO GIỎ" }).click();
  await expect(catalogProduct.getByText("ĐÃ THÊM VÀO GIỎ", { exact: true })).toBeVisible();

  // Header cart count increments and remains on /san-pham
  await expect(page).toHaveURL(/\/san-pham$/);
  const cartLink = page.getByRole("link", { name: "GIỎ HÀNG (1)" }).first();
  await expect(cartLink).toBeVisible();

  // Navigate to /gio-hang
  await cartLink.click();
  await expect(page).toHaveURL(/\/gio-hang$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "LỰA CHỌN CỦA BẠN", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("1 sản phẩm đang chờ bạn hoàn tất đơn hàng.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByAltText("Bao bì DELIVN Espresso")).toHaveAttribute(
    "src",
    "/products/reference/500g_black_reference.jpg",
  );
  await expect(page.getByText("345.000 ₫", { exact: true }).first()).toBeVisible();

  await revealFooterForScreenshot(page);
  await page.screenshot({
    path: testInfo.outputPath("cart-desktop-1440.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { level: 1, name: "LỰA CHỌN CỦA BẠN", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await revealFooterForScreenshot(page);
  await page.screenshot({
    path: testInfo.outputPath("cart-mobile-390.png"),
    fullPage: true,
  });

  runtime.assertClean();
});

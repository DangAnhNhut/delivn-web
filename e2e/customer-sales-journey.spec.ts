import { expect, test } from "@playwright/test";

import { DEMO_PRODUCTS } from "../src/server/demo/demo-data";
import { expectPersistedEspresso250Order, fillCheckout } from "./support/commerce-flow";
import { resetDemoData } from "./support/demo-db";
import { monitorRuntime } from "./support/runtime-monitor";

test.use({ viewport: { width: 1440, height: 900 } });

test("homepage visitor completes the direct customer sales journey", async ({ page }) => {
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
  await expect(page.getByRole("heading", { level: 1, name: "HOÀN TẤT ĐƠN HÀNG." })).toBeVisible();
  await fillCheckout(page);

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

test("catalog visitor can add to cart, remain on catalog, and view in cart", async ({ page }) => {
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
  await expect(page.getByRole("heading", { level: 1, name: "LỰA CHỌN CỦA BẠN." })).toBeVisible();
  await expect(page.getByText("345.000 ₫", { exact: true }).first()).toBeVisible();

  runtime.assertClean();
});

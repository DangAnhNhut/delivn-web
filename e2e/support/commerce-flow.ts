import { expect, type Page } from "@playwright/test";

import { DEMO_PRODUCTS, DEMO_VARIANTS } from "../../src/server/demo/demo-data";
import { readOrderByNumber } from "./demo-db";

export const E2E_CUSTOMER = {
  name: "E2E Customer",
  phone: "0900000000",
  email: "e2e.customer@example.com",
  address: "123 Đường Kiểm Thử, Thành phố Demo",
  note: "DEV-DEMO E2E CHECKOUT",
} as const;

export async function addEspresso250ToCart(page: Page): Promise<void> {
  await page.goto("/san-pham");
  const product = page.getByRole("article").filter({ hasText: DEMO_PRODUCTS[0].name });
  await expect(product).toBeVisible();
  await product.getByRole("link", { name: /xem chi tiết/i }).click();
  await expect(page).toHaveURL(/\/san-pham\/dev-demo-delivn-espresso$/);
  await page.getByRole("radio", { name: /250g/i }).check();
  await page.getByRole("button", { name: "THÊM VÀO GIỎ" }).click();
  await expect(page.getByText("ĐÃ THÊM VÀO GIỎ", { exact: true })).toBeVisible();
  let cartLink = page.getByRole("link", { name: "GIỎ HÀNG (1)" });
  let openedMobileMenu = false;
  if ((await cartLink.count()) === 0) {
    await page.getByRole("button", { name: "Mở menu" }).click();
    openedMobileMenu = true;
    cartLink = page.getByRole("link", { name: "GIỎ HÀNG (1)" });
  }
  await expect(cartLink.first()).toBeVisible();
  if (openedMobileMenu) await page.getByRole("button", { name: "Đóng menu" }).click();
}

export async function continueToCheckout(page: Page): Promise<void> {
  await page.goto("/gio-hang");
  await expect(page.getByRole("link", { name: DEMO_PRODUCTS[0].name })).toBeVisible();
  await expect(page.getByLabel(new RegExp(`Số lượng ${DEMO_PRODUCTS[0].name}`))).toHaveText("1");
  await page.getByRole("link", { name: /TIẾP TỤC THANH TOÁN/i }).click();
  await expect(page).toHaveURL(/\/thanh-toan$/);
}

export async function fillCheckout(page: Page, note: string = E2E_CUSTOMER.note): Promise<void> {
  await page.getByLabel(/Họ và tên/).fill(E2E_CUSTOMER.name);
  await page.getByLabel(/Số điện thoại/).fill(E2E_CUSTOMER.phone);
  await page.getByLabel(/^Email/).fill(E2E_CUSTOMER.email);
  await page.getByLabel(/Địa chỉ nhận hàng/).fill(E2E_CUSTOMER.address);
  await page.getByLabel(/^Ghi chú/).fill(note);
  await page.getByRole("radio", { name: /THANH TOÁN KHI NHẬN HÀNG/i }).check();
}

export async function expectPersistedEspresso250Order(orderNumber: string): Promise<void> {
  const persisted = await readOrderByNumber(orderNumber);
  expect(persisted).not.toBeNull();
  expect(persisted?.order).toMatchObject({
    customerName: E2E_CUSTOMER.name,
    phone: E2E_CUSTOMER.phone,
    email: E2E_CUSTOMER.email,
    address: E2E_CUSTOMER.address,
    note: E2E_CUSTOMER.note,
    totalVnd: 173_000,
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    orderStatus: "pending",
  });
  expect(persisted?.items).toEqual([
    {
      variantId: DEMO_VARIANTS[0].id,
      productName: DEMO_PRODUCTS[0].name,
      variantName: "250g",
      sku: "DEV-DEMO-ESPRESSO-250",
      unitPriceVnd: 173_000,
      quantity: 1,
      lineTotalVnd: 173_000,
    },
  ]);
  expect(persisted?.inventory).toEqual({ quantity: 100, reservedQuantity: 1 });
  expect(persisted?.history).toEqual([{ fromStatus: null, toStatus: "pending" }]);
}

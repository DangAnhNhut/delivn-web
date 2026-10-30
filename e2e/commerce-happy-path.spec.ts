import { expect, test } from "@playwright/test";

import { DEMO_PRODUCTS, DEMO_VARIANTS } from "../src/server/demo/demo-data";
import { addEspresso250ToCart, continueToCheckout, E2E_CUSTOMER, fillCheckout } from "./support/commerce-flow";
import { readOrderByNumber, resetDemoData } from "./support/demo-db";
import { monitorRuntime } from "./support/runtime-monitor";

test("catalog to checkout creates a real authoritative order", async ({ page }) => {
  await resetDemoData();
  const runtime = monitorRuntime(page);

  await addEspresso250ToCart(page);
  await continueToCheckout(page);
  await fillCheckout(page);

  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/checkout") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "ĐẶT HÀNG" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);

  await expect(page.getByRole("heading", { name: "ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN" })).toBeVisible();
  const orderNumber = await page.getByText(/^DLV-\d{8}-\d{6}$/).textContent();
  expect(orderNumber).toBeTruthy();
  await expect(page.getByText("173.000 ₫", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "GIỎ HÀNG (0)" }).first()).toBeVisible();

  const persisted = await readOrderByNumber(orderNumber!);
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
  runtime.assertClean();
});

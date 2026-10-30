import { expect, test } from "@playwright/test";

import {
  addEspresso250ToCart,
  continueToCheckout,
  expectPersistedEspresso250Order,
  fillCheckout,
} from "./support/commerce-flow";
import { resetDemoData } from "./support/demo-db";
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

  await expectPersistedEspresso250Order(orderNumber!);
  runtime.assertClean();
});

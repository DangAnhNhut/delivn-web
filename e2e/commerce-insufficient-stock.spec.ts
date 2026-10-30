import { expect, test } from "@playwright/test";

import { DEMO_VARIANTS } from "../src/server/demo/demo-data";
import { addEspresso250ToCart, continueToCheckout, fillCheckout } from "./support/commerce-flow";
import {
  countOrdersByNote,
  makeDemoVariantUnavailable,
  resetDemoData,
} from "./support/demo-db";
import { monitorRuntime } from "./support/runtime-monitor";

const NOTE = "DEV-DEMO E2E INSUFFICIENT";

test.afterEach(async () => {
  await resetDemoData();
});

test("insufficient inventory preserves checkout and creates no order", async ({ page }) => {
  await resetDemoData();
  const runtime = monitorRuntime(page, [{ path: "/api/checkout", status: 409 }]);
  const orderCountBefore = await countOrdersByNote(NOTE);

  await addEspresso250ToCart(page);
  await makeDemoVariantUnavailable(DEMO_VARIANTS[0].id);
  await continueToCheckout(page);
  await fillCheckout(page, NOTE);

  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/checkout") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "ĐẶT HÀNG" }).click();
  expect((await responsePromise).status()).toBe(409);

  await expect(page.locator('[data-checkout-error="true"]')).toContainText(
    "Số lượng sản phẩm hiện không còn đủ. Vui lòng điều chỉnh giỏ hàng.",
  );
  await expect(page.getByRole("heading", { name: "ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN" })).toHaveCount(0);
  await expect(page.getByLabel(/^Ghi chú/)).toHaveValue(NOTE);
  await expect(page.getByRole("link", { name: "GIỎ HÀNG (1)" }).first()).toBeVisible();
  expect(await countOrdersByNote(NOTE)).toBe(orderCountBefore);
  runtime.assertClean();
});

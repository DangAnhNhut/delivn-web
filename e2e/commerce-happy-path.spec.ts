import { expect, test } from "@playwright/test";

import { DEMO_VARIANTS } from "../src/server/demo/demo-data";
import {
  addEspresso250ToCart,
  continueToCheckout,
  E2E_CUSTOMER,
  expectPersistedEspresso250Order,
  fillCheckout,
} from "./support/commerce-flow";
import {
  countOrdersByNote,
  readDemoInventory,
  resetDemoData,
} from "./support/demo-db";
import { authenticateE2eUser, E2E_LEGACY_EMAIL } from "./support/auth";
import { monitorRuntime } from "./support/runtime-monitor";

const SCENARIO_A_NOTE = "DEV-DEMO E2E SCENARIO A UNQUOTED";

test.describe.serial("commerce checkout scenarios", () => {
  test.beforeEach(async () => {
    await resetDemoData();
  });

  test("Scenario A: unconfigured shipping displays 'Chưa xác định', disables submit, and rejects API bypass with 422 without creating order or mutating inventory", async ({
    page,
  }) => {
    await authenticateE2eUser(page, E2E_LEGACY_EMAIL);
    const runtime = monitorRuntime(page);
    const beforeOrderCount = await countOrdersByNote(SCENARIO_A_NOTE);
    const beforeInventory = await readDemoInventory(DEMO_VARIANTS[0].id);

    // Disable test shipping quote to simulate no carrier configured
    await page.setExtraHTTPHeaders({ "x-delivn-test-shipping": "disabled" });

    await addEspresso250ToCart(page);
    await continueToCheckout(page);
    await fillCheckout(page, SCENARIO_A_NOTE);

    // Verify UI displays unquoted shipping status and notice
    await expect(page.getByText("Chưa xác định", { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        "Phí vận chuyển cần được xác định theo địa chỉ nhận hàng và biểu phí thực tế của đơn vị vận chuyển trước khi hoàn tất đơn hàng.",
      ).first(),
    ).toBeVisible();

    // Verify submit button is disabled
    const submitButton = page.getByRole("button", { name: "ĐẶT HÀNG" });
    await expect(submitButton).toBeDisabled();

    // Attempt direct API bypass (simulating a script or adversarial request)
    const apiResponse = await page.request.post("/api/checkout", {
      headers: {
        "Content-Type": "application/json",
        "x-delivn-test-shipping": "disabled",
      },
      data: {
        customer: {
          name: E2E_CUSTOMER.name,
          phone: E2E_CUSTOMER.phone,
          email: E2E_CUSTOMER.email,
          address: E2E_CUSTOMER.address,
          note: SCENARIO_A_NOTE,
        },
        paymentMethod: "cod",
        items: [{ variantId: DEMO_VARIANTS[0].id, quantity: 1 }],
      },
    });

    expect(apiResponse.status()).toBe(422);
    const errorBody = await apiResponse.json();
    expect(errorBody).toMatchObject({
      error: {
        code: "SHIPPING_QUOTE_REQUIRED",
      },
    });

    // Verify no order created and no inventory mutation
    expect(await countOrdersByNote(SCENARIO_A_NOTE)).toBe(beforeOrderCount);
    const afterInventory = await readDemoInventory(DEMO_VARIANTS[0].id);
    expect(afterInventory).toEqual(beforeInventory);

    runtime.assertClean();
  });

  test("Scenario B: explicit test shipping provider displays trusted quote, enables submit, and completes COD order with inventory transaction", async ({
    page,
  }) => {
    await authenticateE2eUser(page, E2E_LEGACY_EMAIL);
    const runtime = monitorRuntime(page);

    await addEspresso250ToCart(page);
    await continueToCheckout(page);
    await fillCheckout(page);

    // Verify quote arrives and submit button becomes enabled
    const submitButton = page.getByRole("button", { name: "ĐẶT HÀNG" });
    await expect(submitButton).toBeEnabled();
    await expect(page.getByText("30.000 ₫", { exact: true })).toBeVisible();
    await expect(page.getByText("203.000 ₫", { exact: true })).toBeVisible();

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/checkout") && response.request().method() === "POST",
    );
    await submitButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    await expect(
      page.getByRole("heading", { level: 1, name: "ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN" }),
    ).toBeVisible();
    const orderNumber = await page.getByText(/^DLV-\d{8}-\d{6}$/).textContent();
    expect(orderNumber).toBeTruthy();
    await expect(page.getByText("203.000 ₫", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "GIỎ HÀNG (0)" }).first()).toBeVisible();

    await expectPersistedEspresso250Order(orderNumber!, 30_000);
    runtime.assertClean();
  });
});

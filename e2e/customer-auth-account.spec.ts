import { expect, test, type Page } from "@playwright/test";

import { DEMO_PRODUCTS, DEMO_VARIANTS } from "../src/server/demo/demo-data";
import {
  acceptCheckoutTerms,
  addEspresso250ToCart,
  E2E_CUSTOMER,
  fillCheckoutDetails,
} from "./support/commerce-flow";
import {
  authenticateE2eUser,
  cleanupE2eAuthUsers,
  E2E_AUTH_PASSWORD,
  expireE2eUserSessions,
  readE2eUserId,
} from "./support/auth";
import {
  countOrdersByNote,
  readDemoInventory,
  readOrderByNumber,
  resetDemoData,
} from "./support/demo-db";

const USER_A = "e2e-auth-journey-a@invalid.example";
const USER_B = "e2e-auth-journey-b@invalid.example";
const SESSION_EXPIRY_USER = "e2e-auth-session-expiry@invalid.example";
const GUEST_NOTE = "AUTH E2E GUEST REJECTION";
let orderA = "";
let orderB = "";

async function expectNoOverflow(page: Page): Promise<void> {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
}

async function placeOrder(page: Page): Promise<{ orderNumber: string; requestBody: unknown }> {
  await fillCheckoutDetails(page);
  await acceptCheckoutTerms(page);

  const requestPromise = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/checkout") && request.method() === "POST",
  );
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/checkout") && response.request().method() === "POST",
  );
  const submitButton = page.getByRole("button", { name: "ĐẶT HÀNG" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  const [request, response] = await Promise.all([requestPromise, responsePromise]);
  expect(response.status()).toBe(201);
  await expect(
    page.getByRole("heading", { level: 1, name: "ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN" }),
  ).toBeVisible();
  const orderNumber = await page.getByText(/^DLV-\d{8}-\d{6}$/).textContent();
  expect(orderNumber).toBeTruthy();
  return { orderNumber: orderNumber!, requestBody: request.postDataJSON() };
}

test.describe.serial("customer authentication and owned orders", () => {
  test.beforeAll(async () => {
    await resetDemoData();
    await cleanupE2eAuthUsers([USER_A, USER_B, SESSION_EXPIRY_USER]);
  });

  test.afterAll(async () => {
    await resetDemoData();
    await cleanupE2eAuthUsers([USER_A, USER_B, SESSION_EXPIRY_USER]);
  });

  test("Journey A registers from the checkout gate and sees the owned order", async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await page.getByRole("region", { name: "Giới thiệu DELIVN" })
      .getByRole("link", { name: "CHỌN CÀ PHÊ CỦA BẠN" })
      .click();

    const product = page.getByRole("article").filter({ hasText: DEMO_PRODUCTS[0].name });
    await product.getByRole("radio", { name: /250g/i }).click();
    await product.getByRole("button", { name: "MUA NGAY" }).click();

    await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap\?returnTo=%2Fthanh-toan$/);
    await expect(page.getByRole("heading", { level: 1, name: "ĐĂNG NHẬP" })).toBeVisible();
    await expect(page.getByRole("link", { name: "GIỎ HÀNG (1)" }).first()).toBeVisible();
    await expectNoOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("login-desktop.png"), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("login-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole("heading", { level: 1, name: "ĐĂNG NHẬP" })).toBeVisible();
    await expectNoOverflow(page);
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.getByRole("link", { name: "Đăng ký" }).click();
    await expect(page).toHaveURL(/\/tai-khoan\/dang-ky\?returnTo=%2Fthanh-toan$/);
    await page.getByLabel("Họ và tên").fill("Khách hàng E2E A");
    await page.getByLabel("Email").fill(USER_A);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(E2E_AUTH_PASSWORD);
    await page.getByLabel("Xác nhận mật khẩu").fill(E2E_AUTH_PASSWORD);
    await page.getByRole("button", { name: "TẠO TÀI KHOẢN" }).click();

    await expect(page).toHaveURL(/\/thanh-toan$/);
    await expect(page.getByRole("link", { name: "GIỎ HÀNG (1)" }).first()).toBeVisible();
    const placed = await placeOrder(page);
    orderA = placed.orderNumber;
    expect(placed.requestBody).toEqual({
      customer: {
        name: E2E_CUSTOMER.name,
        phone: E2E_CUSTOMER.phone,
        email: E2E_CUSTOMER.email,
        address: E2E_CUSTOMER.address,
        note: E2E_CUSTOMER.note,
      },
      paymentMethod: "cod",
      items: [{ variantId: DEMO_VARIANTS[0].id, quantity: 1 }],
    });
    expect(JSON.stringify(placed.requestBody)).not.toContain("userId");

    const persisted = await readOrderByNumber(orderA);
    expect(persisted?.order.userId).toBe(await readE2eUserId(USER_A));

    await page.getByRole("link", { name: "XEM ĐƠN HÀNG" }).click();
    await expect(page).toHaveURL(new RegExp(`/tai-khoan/don-hang/${orderA}$`));
    await expect(page.getByRole("heading", { level: 1, name: orderA })).toBeVisible();

    await page.goto("/tai-khoan");
    await expect(page.getByRole("heading", { level: 1, name: "TÀI KHOẢN" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("account-desktop.png"), fullPage: true });
    await page.getByRole("link", { name: "ĐƠN HÀNG CỦA TÔI" }).click();
    await expect(page.getByRole("link", { name: orderA })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await expectNoOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("orders-mobile.png"), fullPage: true });
  });

  test("Journey B logs in as a returning customer and opens My Orders detail", async ({ page }) => {
    await authenticateE2eUser(page, USER_B, "Khách hàng E2E B");
    await page.context().clearCookies();
    await page.goto("/tai-khoan/dang-nhap");
    await page.getByLabel("Email").fill(USER_B);
    await page.getByLabel("Mật khẩu").fill(E2E_AUTH_PASSWORD);
    await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    await expect(page).toHaveURL(/\/tai-khoan$/);

    await addEspresso250ToCart(page);
    await page.goto("/thanh-toan");
    const placed = await placeOrder(page);
    orderB = placed.orderNumber;
    await page.goto("/tai-khoan/don-hang");
    await page.getByRole("link", { name: orderB }).click();
    await expect(page.getByRole("heading", { level: 1, name: orderB })).toBeVisible();
  });

  test("Journey C gives foreign and nonexistent orders identical public behavior", async ({ page }) => {
    await authenticateE2eUser(page, USER_B);
    const foreign = await page.goto(`/tai-khoan/don-hang/${orderA}`);
    expect(foreign?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "KHÔNG TÌM THẤY ĐƠN HÀNG" })).toBeVisible();
    const foreignText = await page.getByRole("main").last().innerText();

    const missing = await page.goto("/tai-khoan/don-hang/DLV-NOT-FOUND");
    expect(missing?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "KHÔNG TÌM THẤY ĐƠN HÀNG" })).toBeVisible();
    expect(await page.getByRole("main").last().innerText()).toBe(foreignText);

    await page.goto(`/tai-khoan/don-hang/${orderB}`);
    await expect(page.getByRole("heading", { level: 1, name: orderB })).toBeVisible();
  });

  test("Journey D rejects guest checkout without creating an order or reservation", async ({ page }) => {
    const beforeOrderCount = await countOrdersByNote(GUEST_NOTE);
    const beforeInventory = await readDemoInventory(DEMO_VARIANTS[0].id);
    const response = await page.request.post("/api/checkout", {
      headers: { origin: "http://127.0.0.1:3100" },
      data: {
        customer: {
          name: E2E_CUSTOMER.name,
          phone: E2E_CUSTOMER.phone,
          email: E2E_CUSTOMER.email,
          address: E2E_CUSTOMER.address,
          note: GUEST_NOTE,
        },
        paymentMethod: "cod",
        items: [{ variantId: DEMO_VARIANTS[0].id, quantity: 1 }],
      },
    });
    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "AUTHENTICATION_REQUIRED" } });
    expect(await countOrdersByNote(GUEST_NOTE)).toBe(beforeOrderCount);
    expect(await readDemoInventory(DEMO_VARIANTS[0].id)).toEqual(beforeInventory);
  });

  test("Journey E preserves delivn.cart.v1 when the database session expires", async ({ page }) => {
    await authenticateE2eUser(page, SESSION_EXPIRY_USER);
    await addEspresso250ToCart(page);
    const before = await page.evaluate(() => localStorage.getItem("delivn.cart.v1"));
    expect(before).toBeTruthy();

    await expireE2eUserSessions(SESSION_EXPIRY_USER);
    await page.goto("/thanh-toan");
    await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap\?returnTo=%2Fthanh-toan$/);
    expect(await page.evaluate(() => localStorage.getItem("delivn.cart.v1"))).toBe(before);
    await expect(page.getByRole("link", { name: "GIỎ HÀNG (1)" }).first()).toBeVisible();
  });
});

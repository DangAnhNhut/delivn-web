import { expect, test, type Page } from "@playwright/test";

import {
  addEspresso250ToCart,
  continueToCheckout,
  expectPersistedEspresso250Order,
  fillCheckout,
} from "./support/commerce-flow";
import { resetDemoData } from "./support/demo-db";
import { authenticateE2eUser, E2E_LEGACY_EMAIL } from "./support/auth";
import { monitorRuntime } from "./support/runtime-monitor";

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
}

async function expectContactMarkLoaded(page: Page, alt: string) {
  const mark = page.getByAltText(alt);
  await expect(mark).toBeVisible();
  await mark.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      mark.evaluate(
        (image) =>
          image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
      ),
    )
    .toBe(true);
}

async function expectFooterRevealed(page: Page) {
  const footer = page.locator("#site-footer");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();
  await expect
    .poll(() =>
      footer
        .locator(".footer-inner")
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity)),
    )
    .toBeGreaterThan(0.99);
}

test("contact hub, legal routes and checkout consent remain usable across compliance viewports", async ({
  page,
}, testInfo) => {
  await resetDemoData();
  await authenticateE2eUser(page, E2E_LEGACY_EMAIL);
  await addEspresso250ToCart(page);

  for (const viewport of [
    { name: "desktop-1440", width: 1440, height: 1000 },
    { name: "desktop-1024", width: 1024, height: 900 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "mobile-390", width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);

    await page.goto("/lien-he");
    const contactHub = page.locator("main article");
    const contactHeading = page.getByRole("heading", {
      level: 1,
      name: "KẾT NỐI VỚI DELIVN",
      exact: true,
    });
    const contactSubtitle = contactHub.getByText(
      "Theo dõi DELIVN trên các kênh chính thức và nền tảng mua sắm trực tuyến.",
      { exact: true },
    );
    await expect(contactHeading).toBeVisible();
    await expect(contactSubtitle).toBeVisible();
    await expect(page).toHaveTitle("Liên hệ | DELIVN");
    await expect(contactHub.getByText("THÔNG TIN DOANH NGHIỆP", { exact: true })).toHaveCount(0);
    await expect(contactHub.getByText("CÔNG TY TNHH CÀ PHÊ DELIVN", { exact: true })).toHaveCount(0);
    await expect(contactHub.getByText("3703119501", { exact: true })).toHaveCount(0);
    await expect(contactHub.getByText("THÔNG TIN LIÊN QUAN", { exact: true })).toHaveCount(0);

    const headingBox = await contactHeading.boundingBox();
    const subtitleBox = await contactSubtitle.boundingBox();
    expect(headingBox).not.toBeNull();
    expect(subtitleBox).not.toBeNull();
    expect(headingBox!.y + headingBox!.height).toBeLessThanOrEqual(subtitleBox!.y);

    for (const channel of [
      {
        id: "youtube",
        href: "https://www.youtube.com/channel/UCsMjU0JedzxRGd3h1YBf_Fw",
      },
      {
        id: "instagram",
        href: "https://www.instagram.com/delivncoffee/",
      },
      {
        id: "facebook",
        href: "https://www.facebook.com/delivncoffee",
      },
    ]) {
      const link = page.locator(`a[data-channel-id="${channel.id}"]`);
      await expect(link).toHaveAttribute("href", channel.href);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }

    for (const pendingId of ["tiktok-shop", "shopee"]) {
      const card = page.locator(`[data-channel-id="${pendingId}"]`);
      await expect(card).toContainText("ĐANG CẬP NHẬT");
      await expect(card.locator("a")).toHaveCount(0);
    }
    for (const alt of [
      "YouTube logo",
      "Instagram logo",
      "Facebook logo",
      "TikTok Shop platform logo",
      "Shopee platform logo",
    ]) {
      await expectContactMarkLoaded(page, alt);
    }
    await expectNoHorizontalOverflow(page);
    await expectFooterRevealed(page);

    if (viewport.name === "desktop-1440" || viewport.name === "mobile-390") {
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      const filename = `contact-${viewport.name}.png`;
      await page.screenshot({
        path: testInfo.outputPath(filename),
        fullPage: true,
      });
    }

    await page.goto("/chinh-sach-van-chuyen");
    await expect(page).toHaveTitle("Chính sách vận chuyển | DELIVN");
    await expect(
      page.getByRole("heading", { level: 1, name: "GIAO NHẬN HÀNG HÓA." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "ĐIỀU KHOẢN GIAO DỊCH" }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/thanh-toan");
    const terms = page.getByRole("checkbox", { name: /Tôi đã đọc và đồng ý/i });
    await expect(terms).toBeVisible();
    await expect(terms).not.toBeChecked();
    await expectNoHorizontalOverflow(page);
  }
});

test("customer opens terms, explicitly accepts them, and completes a confirmed order", async ({
  page,
}) => {
  await resetDemoData();
  await authenticateE2eUser(page, E2E_LEGACY_EMAIL);
  const runtime = monitorRuntime(page);
  await addEspresso250ToCart(page);
  await continueToCheckout(page);

  await page.getByRole("link", { name: "điều khoản giao dịch", exact: true }).click();
  await expect(page).toHaveURL(/\/dieu-khoan-giao-dich$/);
  await expect(page.getByRole("heading", { level: 1, name: "GIAO DỊCH MINH BẠCH." })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/thanh-toan$/);

  await fillCheckout(page);
  await expect(page.getByRole("checkbox", { name: /Tôi đã đọc và đồng ý/i })).toBeChecked();

  const submitButton = page.getByRole("button", { name: "ĐẶT HÀNG" });
  await expect(submitButton).toBeEnabled();

  const checkoutResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/checkout") && response.request().method() === "POST",
  );
  await submitButton.click();
  const response = await checkoutResponse;
  expect(response.status()).toBe(201);

  await expect(
    page.getByRole("heading", { level: 1, name: "ĐƠN HÀNG ĐÃ ĐƯỢC TIẾP NHẬN" }),
  ).toBeVisible();
  const orderNumber = await page.getByText(/^DLV-\d{8}-\d{6}$/).textContent();
  expect(orderNumber).toBeTruthy();
  await expectPersistedEspresso250Order(orderNumber!);
  runtime.assertClean();
});

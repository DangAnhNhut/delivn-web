// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ email: vi.fn(), signup: vi.fn(), social: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("@/lib/auth/auth-client", () => ({ authClient: { signIn: { email: mocks.email, social: mocks.social }, signUp: { email: mocks.signup } } }));

import { AuthForm } from "./AuthForm";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("AuthForm", () => {
  let container: HTMLDivElement; let root: Root;
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it("renders semantic login fields and hides Google when unavailable", () => {
    act(() => root.render(createElement(AuthForm, { mode: "login", returnTo: "/tai-khoan", googleEnabled: false })));
    expect(container.querySelector('input[autocomplete="email"]')).toBeTruthy();
    expect(container.querySelector('input[autocomplete="current-password"]')).toBeTruthy();
    expect(container.textContent).not.toContain("GOOGLE");
  });

  it("preserves the exact guest cart and does not persist PII after login", async () => {
    const cart = '{"version":1,"items":[]}'; localStorage.setItem("delivn.cart.v1", cart);
    mocks.email.mockResolvedValue({ data: {}, error: null });
    act(() => root.render(createElement(AuthForm, { mode: "login", returnTo: "/tai-khoan", googleEnabled: false })));
    const inputs = container.querySelectorAll("input");
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(inputs[0], "customer@example.com"); inputs[0].dispatchEvent(new Event("input", { bubbles: true })); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(inputs[1], "password123"); inputs[1].dispatchEvent(new Event("input", { bubbles: true })); });
    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(localStorage.getItem("delivn.cart.v1")).toBe(cart);
    expect(JSON.stringify(localStorage)).not.toContain("customer@example.com");
    expect(sessionStorage.length).toBe(0);
  });

  it("never sends an unsafe Google callback", async () => {
    act(() => root.render(createElement(AuthForm, { mode: "login", returnTo: "https://evil.test", googleEnabled: true })));
    await act(async () => (container.querySelectorAll("button")[1] as HTMLButtonElement).click());
    expect(mocks.social).toHaveBeenCalledWith({ provider: "google", callbackURL: "/tai-khoan" });
  });

  it("recovers from a rejected credential request without navigating", async () => {
    mocks.email.mockRejectedValue(new Error("network unavailable"));
    act(() => root.render(createElement(AuthForm, { mode: "login", returnTo: "/tai-khoan", googleEnabled: false })));
    const inputs = container.querySelectorAll("input");
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(inputs[0], "customer@example.com");
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(inputs[1], "password123");
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Không thể xác thực");
    expect((container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("recovers from a rejected registration request without navigating", async () => {
    mocks.signup.mockRejectedValue(new Error("duplicate email"));
    act(() => root.render(createElement(AuthForm, { mode: "register", returnTo: "/tai-khoan", googleEnabled: false })));
    const inputs = container.querySelectorAll("input");
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(inputs[0], "Customer");
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(inputs[1], "customer@example.com");
      inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(inputs[2], "password123");
      inputs[2].dispatchEvent(new Event("input", { bubbles: true }));
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(inputs[3], "password123");
      inputs[3].dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));

    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Không thể xác thực");
    expect((container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false);
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

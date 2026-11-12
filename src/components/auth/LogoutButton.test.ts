// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("@/lib/auth/auth-client", () => ({ authClient: { signOut: mocks.signOut } }));

import { LogoutButton } from "./LogoutButton";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("LogoutButton", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(createElement(LogoutButton)));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("keeps the user in place and restores the action when sign-out fails", async () => {
    mocks.signOut.mockRejectedValue(new Error("network unavailable"));

    await act(async () => (container.querySelector("button") as HTMLButtonElement).click());

    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Không thể đăng xuất");
    expect((container.querySelector("button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("blocks a second click while sign-out is pending", async () => {
    let finish!: (value: { data: object; error: null }) => void;
    mocks.signOut.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const button = container.querySelector("button") as HTMLButtonElement;

    act(() => {
      button.click();
      button.click();
    });
    expect(mocks.signOut).toHaveBeenCalledTimes(1);

    await act(async () => finish({ data: {}, error: null }));
    expect(mocks.push).toHaveBeenCalledWith("/");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});

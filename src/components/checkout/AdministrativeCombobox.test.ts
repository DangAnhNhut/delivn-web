// @vitest-environment jsdom

import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdministrativeOption } from "@/data/vietnam-administrative-units";

import { AdministrativeCombobox } from "./AdministrativeCombobox";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const options: readonly AdministrativeOption[] = [
  { code: "01", name: "Thành phố Hà Nội" },
  { code: "48", name: "Thành phố Đà Nẵng" },
  { code: "66", name: "Tỉnh Đắk Lắk" },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  act(() => {
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function keyDown(input: HTMLInputElement, key: string) {
  act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })));
}

function focusInput(input: HTMLInputElement) {
  act(() => input.focus());
}

function ControlledCombobox({
  initialValue = "",
  onChange = () => undefined,
  disabled = false,
  error,
}: {
  initialValue?: string;
  onChange?: (code: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return createElement(AdministrativeCombobox, {
    id: "province",
    label: "Tỉnh / thành phố",
    value,
    options,
    disabled,
    required: true,
    placeholder: "Tìm tỉnh / thành phố",
    error,
    onValueChange(code) {
      onChange(code);
      setValue(code);
    },
  });
}

describe("AdministrativeCombobox", () => {
  it("renders labelled ARIA combobox, listbox, options, and linked errors", () => {
    act(() => root.render(createElement(ControlledCombobox, { error: "Vui lòng chọn." })));

    const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!;
    focusInput(input);

    expect(input.labels?.[0]?.textContent).toContain("Tỉnh / thành phố");
    expect(input.required).toBe(true);
    expect(input.getAttribute("aria-autocomplete")).toBe("list");
    expect(input.getAttribute("aria-expanded")).toBe("true");
    expect(input.getAttribute("aria-controls")).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("province-error");
    expect(container.querySelector('[role="listbox"]')?.id).toBe(
      input.getAttribute("aria-controls"),
    );
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(3);
    expect(container.querySelector("#province-error")?.textContent).toBe("Vui lòng chọn.");
  });

  it("supports accent-insensitive filtering and explicit keyboard commitment", () => {
    const onChange = vi.fn();
    act(() => root.render(createElement(ControlledCombobox, { onChange })));
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!;
    focusInput(input);
    setInputValue(input, "da nang");

    expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
    expect(container.querySelector('[role="option"]')?.textContent).toContain("Đà Nẵng");

    keyDown(input, "ArrowDown");
    expect(input.getAttribute("aria-activedescendant")).toBeTruthy();
    keyDown(input, "Enter");

    expect(onChange).toHaveBeenLastCalledWith("48");
    expect(input.value).toBe("Thành phố Đà Nẵng");
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("supports Home, End, ArrowUp, Escape, and pointer commitment", () => {
    const onChange = vi.fn();
    act(() => root.render(createElement(ControlledCombobox, { onChange })));
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!;
    focusInput(input);

    keyDown(input, "End");
    expect(input.getAttribute("aria-activedescendant")).toContain("option-2");
    keyDown(input, "ArrowUp");
    expect(input.getAttribute("aria-activedescendant")).toContain("option-1");
    keyDown(input, "Home");
    expect(input.getAttribute("aria-activedescendant")).toContain("option-0");
    keyDown(input, "Escape");
    expect(input.getAttribute("aria-expanded")).toBe("false");

    keyDown(input, "ArrowDown");
    const option = [...container.querySelectorAll<HTMLElement>('[role="option"]')].find(
      (element) => element.textContent === "Tỉnh Đắk Lắk",
    )!;
    act(() => option.dispatchEvent(new Event("pointerdown", { bubbles: true })));

    expect(onChange).toHaveBeenLastCalledWith("66");
    expect(input.value).toBe("Tỉnh Đắk Lắk");
  });

  it("clears the canonical code immediately when a committed label is edited", () => {
    const onChange = vi.fn();
    act(() =>
      root.render(createElement(ControlledCombobox, { initialValue: "01", onChange })),
    );
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!;
    expect(input.value).toBe("Thành phố Hà Nội");

    setInputValue(input, "Thành phố Hà Nộx");

    expect(onChange).toHaveBeenLastCalledWith("");
    expect(input.value).toBe("Thành phố Hà Nộx");
    expect(input.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("never commits matching raw text or no-result text on Enter", () => {
    const onChange = vi.fn();
    act(() => root.render(createElement(ControlledCombobox, { onChange })));
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!;
    focusInput(input);

    setInputValue(input, "da nang");
    keyDown(input, "Enter");
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("da nang");

    setInputValue(input, "khong ton tai");
    keyDown(input, "Enter");
    expect(onChange).not.toHaveBeenCalled();
    expect(container.textContent).toContain("KHÔNG TÌM THẤY LỰA CHỌN");
  });

  it("does not open or expose options while disabled", () => {
    act(() => root.render(createElement(ControlledCombobox, { disabled: true })));
    const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!;

    expect(input.disabled).toBe(true);
    expect(input.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });
});

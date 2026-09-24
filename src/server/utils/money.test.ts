import { describe, expect, it } from "vitest";

import { MoneyLimitError } from "@/server/errors/commerce-error";

import { checkedAddVnd, checkedMultiplyVnd } from "./money";

describe("checked VND arithmetic", () => {
  it("accepts exactly the PostgreSQL integer maximum", () => {
    expect(checkedMultiplyVnd(2_147_483_647, 1)).toBe(2_147_483_647);
  });

  it("rejects multiplication overflow", () => {
    expect(() => checkedMultiplyVnd(1_073_741_824, 2)).toThrow(MoneyLimitError);
  });

  it("rejects subtotal accumulation overflow", () => {
    expect(() => checkedAddVnd(1_500_000_000, 1_000_000_000)).toThrow(MoneyLimitError);
  });

  it("rejects final total overflow", () => {
    expect(() => checkedAddVnd(2_147_483_647, 1)).toThrow(MoneyLimitError);
  });

  it("calculates normal commercial integer values exactly", () => {
    const firstLine = checkedMultiplyVnd(125_000, 2);
    const secondLine = checkedMultiplyVnd(220_000, 1);
    expect(checkedAddVnd(firstLine, secondLine)).toBe(470_000);
  });

  it.each([
    [-1, 1],
    [1.5, 1],
    [1, -1],
    [1, 1.5],
  ])("rejects invalid multiply operands %s and %s", (left, right) => {
    expect(() => checkedMultiplyVnd(left, right)).toThrow(MoneyLimitError);
  });
});

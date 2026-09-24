import { MoneyLimitError } from "@/server/errors/commerce-error";

export const POSTGRES_INTEGER_MAX = 2_147_483_647;

function checkedOperand(value: number): bigint {
  if (!Number.isInteger(value) || value < 0 || value > POSTGRES_INTEGER_MAX) {
    throw new MoneyLimitError();
  }
  return BigInt(value);
}

function checkedResult(value: bigint): number {
  if (value < BigInt(0) || value > BigInt(POSTGRES_INTEGER_MAX)) {
    throw new MoneyLimitError();
  }
  return Number(value);
}

export function checkedMultiplyVnd(unitPriceVnd: number, quantity: number): number {
  return checkedResult(checkedOperand(unitPriceVnd) * checkedOperand(quantity));
}

export function checkedAddVnd(leftVnd: number, rightVnd: number): number {
  return checkedResult(checkedOperand(leftVnd) + checkedOperand(rightVnd));
}

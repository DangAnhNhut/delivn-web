export function formatOrderNumber(createdAt: Date, sequenceValue: string): string {
  const sequence = BigInt(sequenceValue);
  if (sequence < BigInt(1) || Number.isNaN(createdAt.getTime())) {
    throw new Error("Invalid order-number input.");
  }
  const year = createdAt.getUTCFullYear();
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(createdAt.getUTCDate()).padStart(2, "0");
  return `DLV-${year}${month}${day}-${sequence.toString().padStart(6, "0")}`;
}

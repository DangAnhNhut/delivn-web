export type PaymentMethod = "cod" | "bank_transfer";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipping"
  | "completed"
  | "cancelled";

export type OrderDTO = {
  id: string;
  orderNumber: string;
  totalVnd: number;
  paymentMethod: PaymentMethod;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

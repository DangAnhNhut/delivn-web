import type { OrderStatus, PaymentMethod, PaymentStatus } from "./order";

export type CustomerOrderSummaryDTO = {
  orderNumber: string;
  totalVnd: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  itemCount: number;
};

export type CustomerOrderDetailDTO = CustomerOrderSummaryDTO & {
  customer: { name: string; phone: string; email: string | null; address: string; note: string | null };
  subtotalVnd: number;
  shippingFeeVnd: number;
  items: Array<{ productName: string; variantName: string; unitPriceVnd: number; quantity: number; lineTotalVnd: number }>;
  statusHistory: Array<{ fromStatus: OrderStatus | null; toStatus: OrderStatus; note: string | null; createdAt: string }>;
};

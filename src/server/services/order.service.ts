import type { OrderDTO } from "@/contracts";
import type { OrderRecord } from "@/server/repositories/order.repository";

export function mapOrderToDto(order: OrderRecord): OrderDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    totalVnd: order.totalVnd,
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
  };
}

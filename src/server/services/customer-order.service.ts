import type { CustomerOrderDetailDTO, CustomerOrderSummaryDTO } from "@/contracts";
import { createCustomerOrderRepository } from "@/server/repositories/customer-order.repository";

type Repository = ReturnType<typeof createCustomerOrderRepository>;

export function createCustomerOrderService(repository: Repository = createCustomerOrderRepository()) {
  return {
    async listByUserId(userId: string): Promise<CustomerOrderSummaryDTO[]> {
      const rows = await repository.listByUserId(userId);
      return rows.map((row) => ({ ...row, itemCount: Number(row.itemCount), createdAt: row.createdAt.toISOString() }));
    },
    async findDetailByOrderNumberAndUserId(orderNumber: string, userId: string): Promise<CustomerOrderDetailDTO | null> {
      const record = await repository.findDetailByOrderNumberAndUserId(orderNumber, userId);
      if (!record) return null;
      const { order, items, statusHistory } = record;
      return {
        orderNumber: order.orderNumber,
        totalVnd: order.totalVnd,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt.toISOString(),
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        customer: { name: order.customerName, phone: order.phone, email: order.email, address: order.address, note: order.note },
        subtotalVnd: order.subtotalVnd,
        shippingFeeVnd: order.shippingFeeVnd,
        items: items.map((item) => ({ productName: item.productNameSnapshot, variantName: item.variantNameSnapshot, unitPriceVnd: item.unitPriceVndSnapshot, quantity: item.quantity, lineTotalVnd: item.lineTotalVnd })),
        statusHistory: statusHistory.map((entry) => ({ fromStatus: entry.fromStatus, toStatus: entry.toStatus, note: entry.note, createdAt: entry.createdAt.toISOString() })),
      };
    },
  };
}

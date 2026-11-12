import Link from "next/link";
import type { CustomerOrderSummaryDTO } from "@/contracts";
import { formatVnd } from "@/lib/storefront/product-presentation";

export function OrderList({ orders }: { orders: CustomerOrderSummaryDTO[] }) {
  if (!orders.length) {
    return (
      <div className="border-y border-border py-16 text-center">
        <h2 className="text-2xl font-bold uppercase">CHƯA CÓ ĐƠN HÀNG</h2>
        <Link
          href="/san-pham"
          className="mt-6 inline-flex min-h-11 items-center border border-foreground px-5 text-xs font-bold uppercase"
        >
          KHÁM PHÁ SẢN PHẨM
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {orders.map((order) => (
        <li
          key={order.orderNumber}
          className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/tai-khoan/don-hang/${encodeURIComponent(order.orderNumber)}`}
                className="font-bold underline-offset-4 hover:underline"
              >
                {order.orderNumber}
              </Link>
              <span className="text-xs font-semibold uppercase">
                {order.orderStatus}
              </span>
              <span className="text-xs text-foreground-muted">
                · {order.paymentMethod} ({order.paymentStatus})
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground-muted">
              {new Intl.DateTimeFormat("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date(order.createdAt))}{" "}
              · {order.itemCount} sản phẩm
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatVnd(order.totalVnd)}</p>
            <Link
              href={`/tai-khoan/don-hang/${encodeURIComponent(order.orderNumber)}`}
              className="mt-1 inline-block text-xs font-semibold uppercase underline"
            >
              Xem đơn hàng
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

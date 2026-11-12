import type { CustomerOrderDetailDTO } from "@/contracts";
import { formatVnd } from "@/lib/storefront/product-presentation";

export function OrderDetail({ order }: { order: CustomerOrderDetailDTO }) {
  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(order.createdAt));

  return (
    <article className="space-y-10">
      <header>
        <p className="text-xs font-bold tracking-[0.22em] uppercase">ĐƠN HÀNG</p>
        <h1 className="mt-3 break-words text-4xl font-bold uppercase sm:text-6xl">
          {order.orderNumber}
        </h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Ngày đặt: <time dateTime={order.createdAt}>{formattedDate}</time>
        </p>
      </header>

      <section className="grid gap-8 border-y border-border py-8 lg:grid-cols-2">
        <div>
          <h2 className="font-bold uppercase">Giao hàng</h2>
          <address className="mt-3 not-italic text-sm leading-7 text-foreground-muted">
            {order.customer.name}
            <br />
            {order.customer.phone}
            {order.customer.email ? (
              <>
                <br />
                {order.customer.email}
              </>
            ) : null}
            <br />
            {order.customer.address}
            {order.customer.note ? (
              <>
                <br />
                Ghi chú: {order.customer.note}
              </>
            ) : null}
          </address>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs uppercase text-foreground-muted">Trạng thái</dt>
            <dd className="mt-1 font-semibold">{order.orderStatus}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-foreground-muted">Thanh toán</dt>
            <dd className="mt-1 font-semibold">
              {order.paymentMethod} ({order.paymentStatus})
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="font-bold uppercase">Sản phẩm</h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {order.items.map((item, index) => (
            <li
              key={`${item.productName}-${item.variantName}-${index}`}
              className="grid gap-2 py-5 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-semibold">{item.productName}</p>
                <p className="text-sm text-foreground-muted">
                  {item.variantName} × {item.quantity} ({formatVnd(item.unitPriceVnd)} / sản phẩm)
                </p>
              </div>
              <p className="font-semibold">{formatVnd(item.lineTotalVnd)}</p>
            </li>
          ))}
        </ul>

        <dl className="ml-auto mt-6 max-w-sm space-y-3">
          <div className="flex justify-between">
            <dt>Tạm tính</dt>
            <dd>{formatVnd(order.subtotalVnd)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Phí vận chuyển</dt>
            <dd>{formatVnd(order.shippingFeeVnd)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
            <dt>Tổng</dt>
            <dd>{formatVnd(order.totalVnd)}</dd>
          </div>
        </dl>
      </section>

      {order.statusHistory?.length ? (
        <section className="border-t border-border pt-8">
          <h2 className="font-bold uppercase">Lịch sử xử lý</h2>
          <ul className="mt-4 space-y-3">
            {order.statusHistory.map((history, index) => (
              <li key={index} className="text-sm text-foreground-muted">
                <span className="font-semibold uppercase text-foreground">
                  {history.toStatus}
                </span>
                {history.note ? ` — ${history.note}` : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

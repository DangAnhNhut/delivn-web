import type { CartItem } from "@/lib/cart/cart-types";
import {
  selectCartLineTotalVnd,
  selectCartSubtotalVnd,
} from "@/lib/cart/cart-selectors";
import { formatVnd } from "@/lib/storefront/product-presentation";

export function CheckoutSummary({ items }: { items: readonly CartItem[] }) {
  return (
    <aside aria-labelledby="checkout-summary-title">
      <div className="border-y border-border bg-surface px-6 py-8 sm:px-8 lg:sticky lg:top-[calc(var(--header-height)+2.5rem)]">
        <h2
          id="checkout-summary-title"
          className="text-xs font-bold tracking-[0.2em] text-foreground uppercase"
        >
          ĐƠN HÀNG CỦA BẠN
        </h2>

        <ul className="mt-6 divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.variantId} className="flex min-w-0 justify-between gap-5 py-5">
              <div className="min-w-0">
                <p className="break-words text-sm font-bold leading-snug text-foreground uppercase">
                  {item.productName}
                </p>
                <p className="mt-1 text-xs text-foreground-muted">
                  {item.variantLabel} · Số lượng {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground">
                {formatVnd(selectCartLineTotalVnd(item))}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-baseline justify-between gap-4">
          <p className="text-[10px] font-bold tracking-[0.16em] text-foreground uppercase">
            TẠM TÍNH THAM KHẢO
          </p>
          <p className="text-xl font-semibold text-foreground">
            {formatVnd(selectCartSubtotalVnd(items))}
          </p>
        </div>
        <p className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-foreground-muted">
          Giá và tình trạng sản phẩm sẽ được xác nhận lại khi đặt hàng.
        </p>
      </div>
    </aside>
  );
}

import type { CartItem } from "@/lib/cart/cart-types";
import {
  selectCartLineTotalVnd,
  selectCartSubtotalVnd,
} from "@/lib/cart/cart-selectors";
import { formatVnd } from "@/lib/storefront/product-presentation";

export function CheckoutSummary({ items }: { items: readonly CartItem[] }) {
  return (
    <aside aria-labelledby="checkout-summary-title">
      <div className="border-y border-border bg-cream px-6 py-8 sm:px-8 lg:sticky lg:top-[calc(var(--header-height)+2.5rem)]">
        <p className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          CÀ PHÊ DELIVN
        </p>
        <h2
          id="checkout-summary-title"
          className="mt-3 text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground uppercase sm:text-3xl"
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
          Giá hiển thị là dữ liệu tham khảo từ giỏ hàng. Máy chủ sẽ xác nhận lại
          sản phẩm, khả năng đáp ứng và tổng tiền khi bạn đặt hàng.
        </p>
      </div>
    </aside>
  );
}

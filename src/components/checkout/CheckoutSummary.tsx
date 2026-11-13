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

        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border/60 pt-4">
          <p className="text-[10px] font-bold tracking-[0.16em] text-foreground uppercase">
            PHÍ VẬN CHUYỂN
          </p>
          <p className="text-xs font-semibold tracking-[0.08em] text-foreground-muted uppercase">
            TÍNH THEO BIỂU PHÍ THỰC TẾ
          </p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-foreground-muted">
          Phí vận chuyển được tính theo biểu phí thực tế của đơn vị vận chuyển và địa chỉ nhận hàng. Website không áp dụng chính sách miễn phí vận chuyển mặc định.
        </p>

        <p className="mt-5 border-t border-border pt-5 text-xs leading-relaxed text-foreground-muted">
          Giá sản phẩm là giá bán cuối cùng đã bao gồm thuế giá trị gia tăng (VAT). DELIVN hỗ trợ xuất hóa đơn điện tử theo yêu cầu.
        </p>
      </div>
    </aside>
  );
}

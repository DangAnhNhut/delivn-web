import Link from "next/link";

interface CartLinkProps {
  className?: string;
  onClick?: () => void;
}

export const CART_ROUTE = "/gio-hang";
export const CART_LABEL = "GIỎ HÀNG";
export const DEFAULT_CART_COUNT = 0;

export function CartLink({ className, onClick }: CartLinkProps) {
  return (
    <Link
      href={CART_ROUTE}
      onClick={onClick}
      aria-label={`${CART_LABEL} (${DEFAULT_CART_COUNT})`}
      className={
        className ??
        "text-[13px] font-medium tracking-[0.18em] text-foreground-muted hover:text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
      }
    >
      <span>{CART_LABEL}</span> <span>({DEFAULT_CART_COUNT})</span>
    </Link>
  );
}

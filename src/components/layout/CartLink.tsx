"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/CartProvider";

interface CartLinkProps {
  className?: string;
  onClick?: () => void;
}

export const CART_ROUTE = "/gio-hang";
export const CART_LABEL = "GIỎ HÀNG";

export function CartLink({ className, onClick }: CartLinkProps) {
  const { isHydrated, itemCount } = useCart();
  const count = isHydrated ? itemCount : 0;

  return (
    <Link
      href={CART_ROUTE}
      onClick={onClick}
      aria-label={`${CART_LABEL} (${count})`}
      className={
        className ??
        "text-[13px] font-medium tracking-[0.18em] text-foreground-muted hover:text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
      }
    >
      <span>{CART_LABEL}</span> <span>({count})</span>
    </Link>
  );
}

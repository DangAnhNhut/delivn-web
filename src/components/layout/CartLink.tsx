"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/CartProvider";

interface CartLinkProps {
  className?: string;
  onClick?: () => void;
  variant?: "text" | "icon";
}

export const CART_ROUTE = "/gio-hang";
export const CART_LABEL = "GIỎ HÀNG";

export function CartLink({
  className,
  onClick,
  variant = "text",
}: CartLinkProps) {
  const { isHydrated, itemCount } = useCart();
  const count = isHydrated ? itemCount : 0;

  if (variant === "icon") {
    return (
      <Link
        href={CART_ROUTE}
        onClick={onClick}
        aria-label={count > 0 ? `Giỏ hàng (${count})` : "Giỏ hàng"}
        className={
          className ??
          "relative inline-flex items-center justify-center w-10 h-10 text-[#EEEAE2] hover:opacity-80 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
        }
      >
        <svg
          className="w-[23px] h-[23px] lg:w-[26px] lg:h-[26px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 7h12l1 12H5L6 7Z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#EF4E3E] text-[#FAF6F1] text-[10px] font-semibold leading-none flex items-center justify-center tabular-nums"
          >
            {count}
          </span>
        )}
      </Link>
    );
  }

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

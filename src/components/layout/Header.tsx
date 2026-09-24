import Link from "next/link";
import Image from "next/image";
import { MobileMenuButton } from "./MobileMenuButton";
import { CartLink } from "./CartLink";

const navigation = [
  { label: "SẢN PHẨM", href: "/san-pham" },
  { label: "CÂU CHUYỆN", href: "/cau-chuyen" },
  { label: "CÁCH PHA", href: "/cach-pha" },
  { label: "LIÊN HỆ", href: "/lien-he" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-[var(--header-height)] border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="site-shell h-full flex items-center justify-between">
        {/* Logo — left */}
        <div className="flex-1">
          <Link
            href="/"
            aria-label="DELIVN — Trang chủ"
            className="inline-block transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
          >
            <Image
              src="/brand/delivn-logo.svg"
              alt="DELIVN Logo"
              width={96}
              height={72}
              className="h-11 sm:h-12 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Desktop navigation — center */}
        <nav
          aria-label="Menu chính"
          className="hidden md:flex items-center gap-10 lg:gap-14"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs lg:text-[13px] font-semibold tracking-[0.22em] text-foreground-muted hover:text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Cart link + mobile menu toggle — right */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <CartLink className="hidden md:inline-flex text-xs lg:text-[13px] font-semibold tracking-[0.18em] text-foreground-muted hover:text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm" />
          <MobileMenuButton navigation={navigation} />
        </div>
      </div>
    </header>
  );
}

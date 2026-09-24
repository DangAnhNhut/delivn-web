"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CartLink } from "./CartLink";

interface NavItem {
  readonly label: string;
  readonly href: string;
}

export function MobileMenuButton({
  navigation,
}: {
  navigation: readonly NavItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll when mobile menu is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Close on Escape key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-drawer"
        aria-label={isOpen ? "Đóng menu" : "Mở menu"}
        className="flex items-center justify-center w-10 h-10 -mr-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {isOpen ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng di động"
          className="fixed inset-x-0 top-[var(--header-height)] bottom-0 bg-background z-40"
        >
          <nav
            className="flex flex-col items-center gap-8 pt-16"
            aria-label="Menu di động"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="text-base font-medium tracking-[0.2em] text-foreground-muted hover:text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
              >
                {item.label}
              </Link>
            ))}
            <CartLink
              onClick={close}
              className="text-base font-medium tracking-[0.2em] text-foreground-muted hover:text-foreground transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
            />
          </nav>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { CartLink } from "./CartLink";
import { AccountLink } from "@/components/auth/AccountLink";

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
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

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
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="site-nav-drawer"
        aria-label={isOpen ? "Đóng menu" : "Mở menu"}
        className="group inline-flex items-center justify-center w-10 h-10 -ml-1.5 text-[#EEEAE2] hover:opacity-80 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm cursor-pointer"
      >
        <svg
          className="w-[26px] h-[26px] lg:w-[30px] lg:h-[30px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line
            x1="3.5"
            y1="6.5"
            x2="20.5"
            y2="6.5"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
          <line x1="3.5" y1="12" x2="20.5" y2="12" />
          <line
            x1="3.5"
            y1="17.5"
            x2="20.5"
            y2="17.5"
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng"
          id="site-nav-drawer"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="relative z-10 w-[min(86vw,360px)] h-full bg-[#171717] text-[#EEEAE2] border-r border-white/10 flex flex-col justify-between p-6 sm:p-8 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <Link
                  href="/"
                  onClick={close}
                  aria-label="DELIVN — Trang chủ"
                  className="inline-block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
                >
                  <Image
                    src="/brand/delivn-logo-white.svg"
                    alt="DELIVN Logo"
                    width={84}
                    height={63}
                    className="w-[74px] h-auto object-contain"
                  />
                </Link>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={close}
                  aria-label="Đóng menu"
                  className="inline-flex items-center justify-center w-10 h-10 -mr-2 text-[#EEEAE2] hover:opacity-75 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm cursor-pointer"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              </div>

              <nav
                className="flex flex-col gap-5 pt-8"
                aria-label="Menu điều hướng"
              >
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="text-sm sm:text-[15px] font-semibold tracking-[0.2em] text-[#EEEAE2]/85 hover:text-white transition-colors duration-200 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-5">
                  <AccountLink
                    onClick={close}
                    className="text-sm sm:text-[15px] font-semibold tracking-[0.2em] text-[#EEEAE2]/85 hover:text-white transition-colors duration-200 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
                  />
                  <CartLink
                    onClick={close}
                    className="text-sm sm:text-[15px] font-semibold tracking-[0.2em] text-[#EEEAE2]/85 hover:text-white transition-colors duration-200 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
                  />
                </div>
              </nav>
            </div>

            <p className="text-[11px] font-mono tracking-[0.18em] uppercase text-[#EEEAE2]/45">
              TÂY NGUYÊN · VIỆT NAM
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

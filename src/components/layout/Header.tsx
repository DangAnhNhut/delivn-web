import Link from "next/link";
import Image from "next/image";
import { headerContent } from "@/data/content/home";
import { MobileMenuButton } from "./MobileMenuButton";
import { CartLink } from "./CartLink";

export function Header() {
  return (
    <header className="relative z-50 w-full">
      {/* Tier 1: Brand Strip */}
      <div className="h-[36px] sm:h-[40px] lg:h-[42px] w-full bg-[#F7F4EE] border-b border-[#1E1E1E]/10 flex items-center justify-center px-4">
        <p className="text-[12px] sm:text-[13px] lg:text-[14.5px] leading-none text-[#1A1A1A] text-center whitespace-nowrap overflow-hidden text-ellipsis font-sans">
          <span className="font-bold uppercase tracking-[0.04em]">
            {headerContent.brandPrefix}
          </span>
          <span className="font-normal">
            {" "}
            — {headerContent.brandTagline}
          </span>
        </p>
      </div>

      {/* Tier 2: Main Navigation */}
      <div className="h-[70px] md:h-[84px] lg:h-[96px] w-full bg-[#171717]">
        <div className="w-full max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-10 grid grid-cols-[1fr_auto_1fr] items-center">
          {/* Left: Menu */}
          <div className="flex items-center justify-start">
            <MobileMenuButton navigation={headerContent.navigation} />
          </div>

          {/* Center: Official DELIVN Logo */}
          <div className="flex items-center justify-center">
            <Link
              href="/"
              aria-label="DELIVN — Trang chủ"
              className="inline-flex items-center justify-center transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
            >
              <Image
                src="/brand/delivn-logo-white.svg"
                alt="DELIVN Logo"
                width={122}
                height={92}
                className="w-[78px] sm:w-[88px] lg:w-[114px] xl:w-[122px] h-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Right: Search + Cart */}
          <div className="flex items-center justify-end gap-3 sm:gap-5 lg:gap-7">
            <button
              type="button"
              aria-label="Tìm kiếm"
              className="inline-flex items-center justify-center w-10 h-10 text-[#EEEAE2] hover:opacity-80 transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm cursor-pointer"
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
                <circle cx="11" cy="11" r="7" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
            </button>
            <CartLink variant="icon" />
          </div>
        </div>
      </div>
    </header>
  );
}

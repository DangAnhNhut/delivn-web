import Image from "next/image";
import {
  CONTACT_CHANNELS,
  type ContactChannel,
} from "@/data/contact";

export interface MoitNoticeConfig {
  readonly href: string;
  readonly imageSrc: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

const CHANNEL_ORDER = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok-shop",
  "shopee",
] as const;

function SocialPlatformIcon({ id }: { id: string }) {
  switch (id) {
    case "facebook":
      return (
        <svg
          viewBox="0 0 24 24"
          className="size-5 sm:size-6"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
        </svg>
      );
    case "instagram":
      return (
        <svg
          viewBox="0 0 24 24"
          className="size-5 sm:size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "youtube":
      return (
        <svg
          viewBox="0 0 24 24"
          className="size-5 sm:size-6"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15.2V8.8l5.2 3.2-5.2 3.2z" />
        </svg>
      );
    case "tiktok-shop":
      return (
        <svg
          viewBox="0 0 24 24"
          className="size-5 sm:size-6"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M16.6 5.8A4.2 4.2 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2-2.5V9.7a5.8 5.8 0 1 0 5.1 5.7V9.2a7.3 7.3 0 0 0 4.3 1.4V7.5a4.2 4.2 0 0 1-3.2-1.7z" />
        </svg>
      );
    case "shopee":
      return (
        <svg
          viewBox="0 0 24 24"
          className="size-5 sm:size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 8h14l-1.1 11.2a1.8 1.8 0 0 1-1.8 1.6H7.9a1.8 1.8 0 0 1-1.8-1.6L5 8z" />
          <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
          <path d="M14.2 12.1c-.4-.4-1.1-.7-2-.7-1.1 0-1.9.5-1.9 1.3 0 .9.9 1.2 2 1.4 1.2.2 2 .6 2 1.5 0 .9-.9 1.5-2.1 1.5-.9 0-1.7-.3-2.2-.8" />
        </svg>
      );
    default:
      return null;
  }
}

export function SocialConnection({
  moitNotice = null,
}: {
  moitNotice?: MoitNoticeConfig | null;
}) {
  const orderedChannels = (
    CONTACT_CHANNELS as readonly ContactChannel[]
  )
    .filter((channel) =>
      CHANNEL_ORDER.includes(channel.id as (typeof CHANNEL_ORDER)[number])
    )
    .sort((a, b) => {
      const idxA = CHANNEL_ORDER.indexOf(a.id as (typeof CHANNEL_ORDER)[number]);
      const idxB = CHANNEL_ORDER.indexOf(b.id as (typeof CHANNEL_ORDER)[number]);
      return idxA - idxB;
    });

  return (
    <section
      id="kenh-ket-noi"
      aria-labelledby="social-connection-heading"
      className="w-full bg-background border-t border-border/40 py-14 sm:py-16 lg:py-20 text-foreground"
    >
      <div className="site-shell flex flex-col items-center text-center">
        <h2
          id="social-connection-heading"
          className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-[0.04em] uppercase text-foreground"
        >
          KÊNH KẾT NỐI
        </h2>

        <ul
          aria-label="Mạng xã hội và kênh mua sắm của DELIVN"
          className="mt-7 sm:mt-8 flex flex-nowrap items-center justify-center gap-3 sm:gap-5"
        >
          {orderedChannels.map((channel) => {
            const label =
              channel.id === "tiktok-shop" ? "TikTok" : channel.platform;

            return (
              <li key={channel.id} data-channel-id={channel.id}>
                {channel.status === "active" ? (
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    aria-label={`${label} của DELIVN — mở trong tab mới`}
                    className="group inline-flex size-11 sm:size-13 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground hover:bg-cream hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <SocialPlatformIcon id={channel.id} />
                  </a>
                ) : (
                  <span
                    role="img"
                    title={`${label} (${channel.statusLabel})`}
                    aria-label={`${label} — ${channel.statusLabel}`}
                    className="inline-flex size-11 sm:size-13 items-center justify-center rounded-full border border-border bg-surface text-foreground/55 cursor-default select-none"
                  >
                    <SocialPlatformIcon id={channel.id} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {/* Slot chuẩn bị cho logo ĐÃ THÔNG BÁO Bộ Công Thương (chỉ hiển thị khi có xác nhận và URL online.gov.vn chính thức) */}
        {moitNotice ? (
          <div className="mt-8">
            <a
              href={moitNotice.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Thông báo website thương mại điện tử với Bộ Công Thương"
              className="inline-block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
            >
              <Image
                src={moitNotice.imageSrc}
                alt={moitNotice.alt}
                width={moitNotice.width}
                height={moitNotice.height}
                className="h-12 w-auto object-contain"
              />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

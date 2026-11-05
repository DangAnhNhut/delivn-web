import Image from "next/image";

import { CONTACT_CHANNELS, type ContactChannel } from "@/data/contact";

function ChannelMark({ channel }: { channel: ContactChannel }) {
  return (
    <span className="flex size-16 shrink-0 items-center justify-center bg-background p-3 sm:size-[4.5rem]">
      <Image
        src={channel.logo.src}
        alt={channel.logo.alt}
        width={channel.logo.width}
        height={channel.logo.height}
        className="size-full object-contain"
      />
    </span>
  );
}

export function ContactHub() {
  const socialChannels = CONTACT_CHANNELS.filter(
    (channel) => channel.group === "social",
  );
  const shopChannels = CONTACT_CHANNELS.filter(
    (channel) => channel.group === "shop",
  );

  return (
    <article className="overflow-x-clip bg-background py-12 sm:py-16 lg:py-20">
      <div className="site-shell">
        <header className="border-b border-border pb-8 sm:pb-10">
          <p className="text-xs font-bold tracking-[0.24em] text-accent uppercase">
            LIÊN HỆ
          </p>
          <h1 className="mt-3 max-w-4xl break-words text-[clamp(2.25rem,4.5vw,4.5rem)] font-bold leading-[0.98] tracking-[-0.045em] text-foreground uppercase">
            KẾT NỐI VỚI DELIVN
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-foreground-muted sm:text-lg sm:leading-8">
            Theo dõi DELIVN trên các kênh chính thức và nền tảng mua sắm trực
            tuyến.
          </p>
        </header>

        <section aria-labelledby="social-heading" className="mt-10 sm:mt-12">
          <h2
            id="social-heading"
            className="text-xl font-bold tracking-[-0.02em] text-foreground uppercase sm:text-2xl"
          >
            KÊNH CHÍNH THỨC
          </h2>
          <div className="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {socialChannels.map((channel) =>
              channel.status === "active" ? (
                <a
                  key={channel.id}
                  data-channel-id={channel.id}
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${channel.platform}: ${channel.displayName} — mở trong tab mới`}
                  className="group flex min-h-48 flex-col justify-between bg-surface p-5 transition-colors hover:bg-cream focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none sm:p-6"
                >
                  <ChannelMark channel={channel} />
                  <span className="mt-6 block">
                    <span className="block text-[10px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
                      {channel.platform}
                    </span>
                    <span className="mt-1.5 block break-words text-lg font-bold text-foreground">
                      {channel.displayName}
                    </span>
                    <span className="mt-4 flex min-h-11 items-center justify-between border-t border-border pt-3 text-[11px] font-bold tracking-[0.17em] text-foreground uppercase transition-colors group-hover:text-accent">
                      {channel.actionLabel}
                      <span aria-hidden="true">↗</span>
                    </span>
                  </span>
                </a>
              ) : null,
            )}
          </div>
        </section>

        <section aria-labelledby="shop-heading" className="mt-10 sm:mt-12">
          <h2
            id="shop-heading"
            className="text-xl font-bold tracking-[-0.02em] text-foreground uppercase sm:text-2xl"
          >
            MUA SẮM TRỰC TUYẾN
          </h2>
          <div className="mt-6 grid gap-px bg-border sm:grid-cols-2">
            {shopChannels.map((channel) =>
              channel.status === "pending" ? (
                <div
                  key={channel.id}
                  data-channel-id={channel.id}
                  className="flex min-h-36 items-center gap-5 bg-surface p-5 sm:p-6"
                >
                  <ChannelMark channel={channel} />
                  <div className="min-w-0">
                    <h3 className="break-words text-lg font-bold text-foreground">
                      {channel.displayName}
                    </h3>
                    <p className="mt-2 text-[10px] font-bold tracking-[0.18em] text-foreground-muted uppercase">
                      {channel.statusLabel}
                    </p>
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

import Link from "next/link";

import {
  LEGAL_ROUTE_LINKS,
  type LegalPageDefinition,
} from "@/data/legal";

export function LegalPage({ page }: { page: LegalPageDefinition }) {
  return (
    <article className="overflow-x-clip bg-background pb-20 pt-14 sm:pb-24 sm:pt-20 lg:pb-32 lg:pt-24">
      <div className="site-shell">
        <header className="max-w-5xl border-b border-border pb-10 sm:pb-14">
          <p className="text-xs font-bold tracking-[0.24em] text-foreground-muted uppercase">
            {page.eyebrow}
          </p>
          <h1 className="mt-4 break-words text-[clamp(2.6rem,6.4vw,6.6rem)] font-bold leading-[0.94] tracking-[-0.055em] text-foreground uppercase">
            {page.title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground-muted sm:text-lg">
            {page.description}
          </p>
          <p className="mt-5 text-[11px] font-semibold tracking-[0.14em] text-foreground-muted uppercase">
            CẬP NHẬT: {page.updated}
          </p>
        </header>

        {page.pendingNotice ? (
          <aside className="mt-8 border-l-4 border-accent bg-surface px-5 py-5" aria-label="Lưu ý nội dung">
            <p className="text-sm font-bold leading-relaxed text-foreground">
              {page.pendingNotice}
            </p>
          </aside>
        ) : null}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
          <div className="min-w-0 space-y-12">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2 className="border-b border-border pb-4 text-sm font-bold tracking-[0.18em] text-foreground uppercase sm:text-base">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-5 break-words text-base leading-8 text-foreground-muted"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.items ? (
                  <ul className="mt-5 space-y-3 text-base leading-7 text-foreground-muted">
                    {section.items.map((item) => (
                      <li key={item} className="flex min-w-0 gap-3 break-words">
                        <span className="mt-[0.7rem] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <nav aria-label="Thông tin pháp lý và chính sách" className="lg:sticky lg:top-[calc(var(--header-height)+2.5rem)] lg:self-start">
            <h2 className="text-xs font-bold tracking-[0.2em] text-foreground uppercase">
              THÔNG TIN LIÊN QUAN
            </h2>
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {LEGAL_ROUTE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-12 items-center py-3 text-xs font-bold tracking-[0.12em] text-foreground uppercase transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

import { PdfDocumentViewer } from "@/components/declarations/PdfDocumentViewer";
import { PRODUCT_DECLARATION_DOSSIERS } from "@/data/product-declarations";

export const metadata: Metadata = {
  title: {
    absolute: "Bản tự công bố sản phẩm | DELIVN",
  },
  description:
    "Tra cứu bản tự công bố sản phẩm và hồ sơ kiểm nghiệm cà phê hạt rang Espresso, cà phê rang xay pha phin của DELIVN.",
  alternates: {
    canonical: "https://delivn.com.vn/ban-tu-cong-bo-san-pham",
  },
};

export default function ProductSelfDeclarationPage() {
  return (
    <article className="overflow-x-clip bg-background pb-20 pt-10 sm:pb-24 sm:pt-14 lg:pb-28 lg:pt-16">
      <div className="site-shell">
        <div className="mx-auto max-w-[1060px]">
          {/* Section 01 — Page Header */}
          <header className="border-b border-border pb-8 sm:pb-10">
            <nav
              aria-label="Breadcrumb"
              className="text-xs font-medium tracking-[0.08em] text-foreground-muted"
            >
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link
                    href="/"
                    className="hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
                  >
                    Trang chủ
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-foreground" aria-current="page">
                  Bản tự công bố sản phẩm
                </li>
              </ol>
            </nav>

            <h1 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-foreground uppercase sm:text-4xl lg:text-[42px] lg:leading-[1.12]">
              BẢN TỰ CÔNG BỐ SẢN PHẨM
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground-muted sm:text-[17px]">
              Hồ sơ tự công bố sản phẩm và kết quả kiểm nghiệm của CÔNG TY TNHH
              CÀ PHÊ DELIVN.
            </p>
          </header>

          {/* Sections 02 & 03 — Vertical Dossiers (Open by Default) */}
          <div className="mt-10 space-y-14 sm:mt-12 sm:space-y-16">
            {PRODUCT_DECLARATION_DOSSIERS.map((dossier) => (
              <section
                key={dossier.id}
                aria-labelledby={`${dossier.id}-heading`}
                className="border-b border-border pb-12 last:border-b-0 last:pb-0 sm:pb-14"
              >
                <p className="text-[11px] font-bold tracking-[0.2em] text-foreground-muted uppercase">
                  {dossier.indexLabel}
                </p>

                <h2
                  id={`${dossier.id}-heading`}
                  className="mt-2 text-xl font-bold tracking-[-0.02em] text-foreground uppercase sm:text-2xl"
                >
                  {dossier.title}
                </h2>

                <dl className="mt-5 grid grid-cols-1 gap-3 border border-border bg-surface p-4 text-sm sm:grid-cols-2 sm:gap-4 sm:p-5">
                  <div>
                    <dt className="text-[11px] font-semibold tracking-[0.12em] text-foreground-muted uppercase">
                      Số tự công bố
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {dossier.declarationNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold tracking-[0.12em] text-foreground-muted uppercase">
                      Ngày tự công bố
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {dossier.declarationDate}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold tracking-[0.12em] text-foreground-muted uppercase">
                      Thành phần
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {dossier.ingredients}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold tracking-[0.12em] text-foreground-muted uppercase">
                      Quy cách
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {dossier.packaging}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a
                    href={dossier.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center border border-foreground bg-background px-4 py-2.5 text-xs font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Mở PDF trong tab mới
                  </a>
                  <a
                    href={dossier.pdfUrl}
                    download={dossier.downloadFileName}
                    className="inline-flex items-center justify-center border border-border bg-surface px-4 py-2.5 text-xs font-semibold tracking-[0.12em] text-foreground uppercase transition-colors hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    Tải xuống PDF
                  </a>
                </div>

                <div className="mt-5">
                  <PdfDocumentViewer
                    pdfUrl={dossier.pdfUrl}
                    title={dossier.title}
                    expectedPageCount={dossier.pageCount}
                  />
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}


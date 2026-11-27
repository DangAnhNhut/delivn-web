"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface PdfDocumentViewerProps {
  pdfUrl: string;
  title: string;
  expectedPageCount: number;
}

const ZOOM_MIN = 0.75;
const ZOOM_MAX = 1.75;
const ZOOM_STEP = 0.25;

function PdfPageCanvas({
  pdfDoc,
  pageNumber,
  zoom,
  containerWidth,
}: {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
  containerWidth: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shouldRender, setShouldRender] = useState(pageNumber <= 2);
  const [isRendered, setIsRendered] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(210 / 297);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || shouldRender) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "450px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender || containerWidth <= 0) return;

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;

    async function drawPage() {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        setAspectRatio(baseViewport.width / baseViewport.height);

        const targetCssWidth = Math.max(260, containerWidth * zoom);
        const cssScale = targetCssWidth / baseViewport.width;
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: cssScale * outputScale });

        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(targetCssWidth)}px`;
        canvas.style.height = `${Math.floor(
          (baseViewport.height / baseViewport.width) * targetCssWidth
        )}px`;

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
        });
        await renderTask.promise;
        if (!cancelled) {
          setIsRendered(true);
        }
      } catch {
        // Ignore cancelled render tasks during fast zoom changes
      }
    }

    drawPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNumber, zoom, containerWidth, shouldRender]);

  const placeholderWidth = Math.max(260, containerWidth * zoom);
  const placeholderHeight = Math.round(placeholderWidth / aspectRatio);

  return (
    <div
      ref={wrapperRef}
      data-pdf-page={pageNumber}
      className="relative mx-auto flex flex-col items-center bg-white shadow-sm border border-border/70"
      style={{
        width: `${Math.floor(placeholderWidth)}px`,
        minHeight: isRendered ? undefined : `${placeholderHeight}px`,
      }}
    >
      {!isRendered ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-surface text-xs font-medium tracking-[0.12em] text-foreground-muted uppercase"
        >
          Đang tải trang {pageNumber} / {pdfDoc.numPages}...
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className="block max-w-none"
        aria-label={`Trang ${pageNumber} của ${pdfDoc.numPages}`}
      />
      <div className="w-full border-t border-border/50 bg-[#FAF7F2] px-3 py-1.5 text-right text-[11px] font-medium tracking-[0.08em] text-foreground-muted">
        Trang {pageNumber} / {pdfDoc.numPages}
      </div>
    </div>
  );
}

export function PdfDocumentViewer({
  pdfUrl,
  title,
  expectedPageCount,
}: PdfDocumentViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(expectedPageCount);
  const [zoom, setZoom] = useState<number>(1);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      const inner = Math.max(260, el.clientWidth - 32);
      setContainerWidth(inner);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let loadingTask: { promise: Promise<PDFDocumentProxy>; destroy?: () => Promise<void> } | null = null;

    async function loadPdf() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

        loadingTask = pdfjs.getDocument({
          url: pdfUrl,
          wasmUrl: "/pdfjs/wasm/",
        });
        const doc = await loadingTask.promise;
        if (!active) {
          await loadingTask.destroy?.();
          return;
        }
        setNumPages(doc.numPages);
        setPdfDoc(doc);
        setError(null);
      } catch (err) {
        console.error("[PdfDocumentViewer] Failed to load PDF:", err);
        if (active) {
          setError(
            "Không thể hiển thị trực tiếp trình xem PDF trên trình duyệt này. Vui lòng dùng nút Mở PDF trong tab mới hoặc Tải xuống PDF."
          );
        }
      }
    }

    loadPdf();

    return () => {
      active = false;
      void loadingTask?.destroy?.();
    };
  }, [pdfUrl]);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      role="region"
      aria-label={`Trình xem tài liệu PDF: ${title}`}
      className="w-full overflow-hidden border border-border bg-[#EFECE6]"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="text-xs font-semibold tracking-[0.14em] text-foreground-muted uppercase">
          Hiển thị đầy đủ {numPages} trang
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Number((z - ZOOM_STEP).toFixed(2))))}
            disabled={zoom <= ZOOM_MIN}
            aria-label={`Thu nhỏ tài liệu ${title}`}
            className="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-surface-strong disabled:opacity-40 cursor-pointer"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            aria-label={`Đặt tỷ lệ hiển thị 100% cho ${title}`}
            className="inline-flex h-8 min-w-[3.5rem] items-center justify-center border border-border bg-background px-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-strong cursor-pointer"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Number((z + ZOOM_STEP).toFixed(2))))}
            disabled={zoom >= ZOOM_MAX}
            aria-label={`Phóng to tài liệu ${title}`}
            className="inline-flex h-8 w-8 items-center justify-center border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-surface-strong disabled:opacity-40 cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* Scrollable document pages */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        aria-label={`Nội dung ${numPages} trang của ${title}`}
        className="max-h-[78vh] min-h-[480px] w-full overflow-y-auto overflow-x-auto p-4 sm:p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {error ? (
          <div className="mx-auto max-w-xl border border-border bg-background p-6 text-center text-sm text-foreground-muted">
            <p>{error}</p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center border border-foreground px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:bg-foreground hover:text-background"
            >
              Mở PDF trong tab mới
            </a>
          </div>
        ) : !pdfDoc ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="mx-auto flex h-[540px] max-w-[780px] items-center justify-center border border-border/70 bg-surface text-xs font-medium tracking-[0.12em] text-foreground-muted uppercase"
              >
                Đang tải tài liệu PDF ({expectedPageCount} trang)...
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {Array.from({ length: pdfDoc.numPages }, (_, index) => (
              <PdfPageCanvas
                key={index + 1}
                pdfDoc={pdfDoc}
                pageNumber={index + 1}
                zoom={zoom}
                containerWidth={containerWidth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

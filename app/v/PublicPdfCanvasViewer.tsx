"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./DocumentViewer.module.css";

type PdfViewport = { readonly width: number; readonly height: number };
type PdfRenderTask = { readonly promise: Promise<unknown>; cancel(): void };
type PdfPage = {
  getViewport(input: { readonly scale: number }): PdfViewport;
  render(input: { readonly canvas: HTMLCanvasElement; readonly canvasContext: CanvasRenderingContext2D; readonly viewport: PdfViewport; readonly transform?: readonly number[] }): PdfRenderTask;
};
type PdfDocument = { readonly numPages: number; getPage(page: number): Promise<PdfPage>; destroy(): Promise<void> };

function PdfPageCanvas({ document, pageNumber }: { readonly document: PdfDocument; readonly pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let active = true;
    let task: PdfRenderTask | null = null;
    void document.getPage(pageNumber).then((page) => {
      if (!active || !canvasRef.current || !frameRef.current) return;
      const base = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(240, frameRef.current.clientWidth - 24);
      const scale = Math.min(2, availableWidth / base.width);
      const viewport = page.getViewport({ scale });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("PDF_CANVAS_CONTEXT_UNAVAILABLE");
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      task = page.render({ canvas, canvasContext: context, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
      return task.promise.then(() => { if (active) setRendered(true); });
    });
    return () => { active = false; task?.cancel(); };
  }, [document, pageNumber]);

  return <div className={styles.pdfPage} data-page={pageNumber} ref={frameRef}>
    <canvas
      aria-label={`PDF ${pageNumber}페이지`}
      className={styles.pdfCanvas}
      data-rendered={rendered ? "true" : "false"}
      data-testid={`public-document-pdf-page-${pageNumber}`}
      ref={canvasRef}
    />
  </div>;
}

export default function PublicPdfCanvasViewer({ bytes, label, onError }: { readonly bytes: Uint8Array; readonly label: string; readonly onError: () => void }) {
  const [document, setDocument] = useState<PdfDocument | null>(null);

  useEffect(() => {
    let active = true;
    let current: PdfDocument | null = null;
    let loadingTask: { readonly promise: Promise<PdfDocument>; destroy(): Promise<void> } | null = null;
    void import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
      loadingTask = pdfjs.getDocument({ data: bytes.slice() }) as unknown as typeof loadingTask;
      return loadingTask!.promise;
    }).then((loaded) => {
      current = loaded;
      if (active) setDocument(loaded);
      else void loaded.destroy();
    }).catch(() => { if (active) onError(); });
    return () => {
      active = false;
      setDocument(null);
      if (loadingTask && !current) void loadingTask.destroy();
      if (current) void current.destroy();
    };
  }, [bytes, onError]);

  if (!document) return <section aria-label={label} className={styles.pdfLoading}><span>PDF 페이지를 준비하고 있습니다.</span></section>;
  return <section aria-label={label} className={styles.pdfPages} data-page-count={document.numPages} data-testid="public-document-pdf-pages">
    {Array.from({ length: document.numPages }, (_, index) => <PdfPageCanvas document={document} key={index + 1} pageNumber={index + 1} />)}
  </section>;
}

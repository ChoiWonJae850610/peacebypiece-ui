"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Paperclip } from "lucide-react";

import styles from "./DocumentViewer.module.css";
import PublicPdfCanvasViewer from "./PublicPdfCanvasViewer";

type ViewerMetadata = {
  readonly title: "작업지시서";
  readonly displayDocumentNumber: string;
  readonly expiresAt: string | null;
  readonly accessCount: number;
  readonly attachments: readonly {
    readonly ref: string;
    readonly filename: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly inlineSupported: boolean;
    readonly inlineUrl: string | null;
    readonly downloadUrl: string;
  }[];
};

type SessionEnvelope =
  | { readonly ok: true; readonly data: ViewerMetadata }
  | { readonly ok: false };

const unavailableMessage = "공유 링크를 사용할 수 없습니다. 링크가 잘못되었거나 만료 또는 회수되었을 수 있습니다.";
const networkMessage = "문서를 확인하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.";
const VIEWER_SESSION_TIMEOUT_MS = 15_000;

export default function DocumentViewerClient() {
  const [metadata, setMetadata] = useState<ViewerMetadata | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setMetadata(null);
    setPdfBytes(null);
    setError(null);
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), VIEWER_SESSION_TIMEOUT_MS);
    const token = new URLSearchParams(window.location.hash.slice(1)).get("t") ?? "";
    if (!token) {
      void Promise.resolve().then(() => {
        if (active) setError(unavailableMessage);
      });
      window.clearTimeout(timeout);
      return () => { active = false; controller.abort(); };
    }
    fetch("/api/public/document-viewer/session", {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (response) => ({ response, body: await response.json() as SessionEnvelope }))
      .then(async ({ response, body }) => {
        if (!active) return;
        if (!response.ok || !body.ok) {
          setError(unavailableMessage);
          return;
        }
        const pdfResponse = await fetch("/api/public/document-viewer/file", { cache: "no-store", signal: controller.signal });
        const contentType = pdfResponse.headers.get("content-type")?.toLowerCase() ?? "";
        if (!pdfResponse.ok || !contentType.includes("application/pdf")) {
          setError(unavailableMessage);
          return;
        }
        const buffer = await pdfResponse.arrayBuffer();
        if (buffer.byteLength < 5 || buffer.byteLength > 30 * 1024 * 1024) {
          setError(unavailableMessage);
          return;
        }
        const bytes = new Uint8Array(buffer);
        const signature = new TextDecoder("ascii").decode(bytes.subarray(0, 5));
        if (signature !== "%PDF-") {
          setError(unavailableMessage);
          return;
        }
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        setMetadata(body.data);
        setPdfBytes(bytes);
      })
      .catch(() => {
        if (active) setError(networkMessage);
      }).finally(() => {
        window.clearTimeout(timeout);
      });
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [attempt]);

  if (error) {
    return <main className={styles.message}><FileText aria-hidden="true"/><h1>작업지시서</h1><p>{error}</p>{error === networkMessage ? <button onClick={retry} type="button">다시 시도</button> : null}</main>;
  }
  if (!metadata || !pdfBytes) {
    return <main className={styles.message}><FileText aria-hidden="true"/><h1>작업지시서</h1><p>공유 문서를 확인하고 있습니다.</p></main>;
  }

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div><span>{metadata.title}</span><strong>{metadata.displayDocumentNumber}</strong></div>
        <div className={styles.meta}>
          <span>{metadata.expiresAt ? `만료 ${new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(metadata.expiresAt))}` : "관리형 접근"}</span>
          <a href="/api/public/document-viewer/download"><Download aria-hidden="true"/>다운로드</a>
        </div>
      </header>
      <PublicPdfCanvasViewer bytes={pdfBytes} label={`${metadata.displayDocumentNumber} PDF`} onError={() => setError(unavailableMessage)} />
      {metadata.attachments.length > 0 ? <section className={styles.attachments}>
        <div className={styles.attachmentHeading}><Paperclip aria-hidden="true"/><div><strong>전달 첨부</strong><span>작업지시서와 함께 선택된 파일 {metadata.attachments.length}개</span></div></div>
        <div className={styles.attachmentGrid}>{metadata.attachments.map((attachment) => <article className={styles.attachmentCard} key={attachment.ref}>
          {attachment.inlineUrl && /^image\//.test(attachment.mimeType) ? <>
            {/* The controlled token/session route is intentionally not compatible with Next image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={attachment.filename} src={attachment.inlineUrl}/>
          </> : attachment.inlineUrl && attachment.mimeType === "application/pdf" ? <iframe src={attachment.inlineUrl} title={`${attachment.filename} 미리보기`}/> : <FileText aria-hidden="true"/>}
          <div className={styles.attachmentInfo}><strong>{attachment.filename}</strong><span>{attachment.mimeType} · {Math.max(1, Math.ceil(attachment.sizeBytes / 1024)).toLocaleString("ko-KR")} KB</span></div>
          <a href={attachment.downloadUrl}><Download aria-hidden="true"/>다운로드</a>
        </article>)}</div>
      </section> : null}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Paperclip } from "lucide-react";

import styles from "./DocumentViewer.module.css";

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

const unavailableMessage = "공유 링크를 사용할 수 없습니다. 링크가 만료되었거나 회수되었을 수 있습니다.";

export default function DocumentViewerClient() {
  const [metadata, setMetadata] = useState<ViewerMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get("t") ?? "";
    if (!token) {
      void Promise.resolve().then(() => {
        if (active) setError(unavailableMessage);
      });
      return () => { active = false; };
    }
    fetch("/api/public/document-viewer/session", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (response) => ({ response, body: await response.json() as SessionEnvelope }))
      .then(({ response, body }) => {
        if (!active) return;
        if (!response.ok || !body.ok) {
          setError(unavailableMessage);
          return;
        }
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        setMetadata(body.data);
      })
      .catch(() => {
        if (active) setError(unavailableMessage);
      });
    return () => { active = false; };
  }, []);

  if (error) {
    return <main className={styles.message}><FileText aria-hidden="true"/><h1>작업지시서</h1><p>{error}</p></main>;
  }
  if (!metadata) {
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
      <iframe className={styles.viewer} src="/api/public/document-viewer/file" title={`${metadata.displayDocumentNumber} PDF`}/>
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

"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, Eye, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

import type { GeneratedDocumentReadModel, WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";
import DocumentShareControl from "./DocumentShareControl";
import IssuedWorkOrderDocument from "./IssuedWorkOrderDocument";
import styles from "./IssuedWorkOrderPreview.module.css";

type Envelope =
  | { readonly ok: true; readonly data: WorkOrderIssuedPreviewReadModel }
  | { readonly ok: false; readonly error?: { readonly message?: string } };

type DocumentsEnvelope =
  | { readonly ok: true; readonly data: { readonly items: readonly GeneratedDocumentReadModel[] } }
  | { readonly ok: false };

export default function IssuedWorkOrderPreview({ workOrderId, revisionId }: { readonly workOrderId: string; readonly revisionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<WorkOrderIssuedPreviewReadModel | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocumentReadModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/revisions/${encodeURIComponent(revisionId)}/preview`, { cache: "no-store" }),
      fetch(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/documents?limit=50`, { cache: "no-store" }),
    ]).then(async ([previewResponse, documentsResponse]) => ({
      previewResponse,
      documentsResponse,
      previewBody: (await previewResponse.json()) as Envelope,
      documentsBody: (await documentsResponse.json()) as DocumentsEnvelope,
    }))
      .then(({ previewResponse, documentsResponse, previewBody, documentsBody }) => {
        if (!active) return;
        if (!previewResponse.ok || !previewBody.ok) {
          setError(previewBody.ok ? "Preview를 불러오지 못했습니다." : previewBody.error?.message || "Preview를 불러오지 못했습니다.");
          return;
        }
        setData(previewBody.data);
        if (documentsResponse.ok && documentsBody.ok) {
          setGeneratedDocument(documentsBody.data.items.find((item) => item.revisionId === revisionId && item.status === "generated") ?? null);
        }
      })
      .catch(() => {
        if (active) setError("Preview를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [workOrderId, revisionId]);

  if (error) {
    return (
      <main className={styles.shell}>
        <div className={styles.message}>
          <FileText aria-hidden="true" />
          <strong>{error}</strong>
          <button type="button" onClick={() => router.back()}>돌아가기</button>
        </div>
      </main>
    );
  }
  if (!data) return <main className={styles.shell}><div className={styles.message}>작업지시서를 불러오는 중입니다.</div></main>;

  return (
    <main className={styles.shell}>
      <nav className={styles.toolbar} aria-label="작업지시서 도구">
        <button type="button" onClick={() => router.back()} title="돌아가기"><ArrowLeft aria-hidden="true" /><span>돌아가기</span></button>
        <div className={styles.toolbarDocumentState}><span>발행된 작업지시서</span><strong>{data.document.displayDocumentNumber}</strong><small>{generatedDocument ? `PDF ${generatedDocument.generationNumber}차 · 생성 완료` : "생성된 PDF 없음"}</small></div>
        <div className={styles.toolbarActions}>
          {generatedDocument?.inlineUrl ? <a className={styles.toolbarActionLink} href={generatedDocument.inlineUrl} target="_blank" rel="noreferrer" title="PDF 보기"><Eye aria-hidden="true" /><span>PDF 보기</span></a> : null}
          {generatedDocument?.downloadUrl ? <a className={styles.toolbarActionLink} href={generatedDocument.downloadUrl} title="PDF 다운로드"><Download aria-hidden="true" /><span>다운로드</span></a> : null}
          {generatedDocument ? <DocumentShareControl generatedDocumentId={generatedDocument.id}/> : null}
        </div>
      </nav>
      <IssuedWorkOrderDocument data={data} />
    </main>
  );
}

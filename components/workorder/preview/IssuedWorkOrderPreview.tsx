"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

import type { WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";
import IssuedWorkOrderDocument from "./IssuedWorkOrderDocument";
import styles from "./IssuedWorkOrderPreview.module.css";

type Envelope =
  | { readonly ok: true; readonly data: WorkOrderIssuedPreviewReadModel }
  | { readonly ok: false; readonly error?: { readonly message?: string } };

export default function IssuedWorkOrderPreview({ workOrderId, revisionId }: { readonly workOrderId: string; readonly revisionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<WorkOrderIssuedPreviewReadModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/revisions/${encodeURIComponent(revisionId)}/preview`, { cache: "no-store" })
      .then(async (response) => ({ response, body: (await response.json()) as Envelope }))
      .then(({ response, body }) => {
        if (!active) return;
        if (!response.ok || !body.ok) setError(body.ok ? "Preview를 불러오지 못했습니다." : body.error?.message || "Preview를 불러오지 못했습니다.");
        else setData(body.data);
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
        <div><span>발행된 작업지시서</span><strong>{data.document.displayDocumentNumber}</strong></div>
        <button type="button" onClick={() => window.print()} title="인쇄"><Printer aria-hidden="true" /><span>인쇄</span></button>
      </nav>
      <IssuedWorkOrderDocument data={data} />
    </main>
  );
}

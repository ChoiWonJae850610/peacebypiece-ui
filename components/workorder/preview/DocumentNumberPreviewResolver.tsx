"use client";

import { useEffect, useState } from "react";

type TargetEnvelope = { readonly ok: true; readonly data: { readonly workOrderId: string; readonly revisionId: string } } | { readonly ok: false; readonly error?: { readonly message?: string } };

export default function DocumentNumberPreviewResolver({ documentNumber }: { readonly documentNumber: string }) {
  const [message, setMessage] = useState("작업지시서 Preview를 준비하고 있습니다.");
  useEffect(() => {
    let active = true;
    fetch(`/api/v2/work-orders/documents/${encodeURIComponent(documentNumber)}/preview-target`, { cache: "no-store" })
      .then(async (response) => ({ response, body: await response.json() as TargetEnvelope }))
      .then(({ response, body }) => {
        if (!active) return;
        if (!response.ok || !body.ok) {
          setMessage(body.ok ? "Preview 정보를 불러올 수 없습니다." : body.error?.message || "Preview 정보를 불러올 수 없습니다.");
          return;
        }
        window.location.replace(`/workspace/workorders/${encodeURIComponent(body.data.workOrderId)}/revisions/${encodeURIComponent(body.data.revisionId)}/preview`);
      })
      .catch(() => { if (active) setMessage("Preview 정보를 불러올 수 없습니다."); });
    return () => { active = false; };
  }, [documentNumber]);
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#e9e7e2", color: "#172033" }}><p>{message}</p></main>;
}

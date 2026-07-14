"use client";

import { useCallback, useState } from "react";
import { Copy, Link2Off, QrCode, RefreshCw, Share2 } from "lucide-react";

import styles from "./DocumentShareControl.module.css";

type DocumentItem = { readonly id: string; readonly revisionId: string; readonly status: string };
type TokenItem = {
  readonly tokenId: string;
  readonly expiresAt: string;
  readonly lastAccessedAt: string | null;
  readonly accessCount: number;
  readonly status: "active" | "expired" | "revoked";
};
type CreatedToken = TokenItem & { readonly viewerUrl: string; readonly qrSvg: string };

export default function DocumentShareControl({ workOrderId, revisionId }: { readonly workOrderId: string; readonly revisionId: string }) {
  const [open, setOpen] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [items, setItems] = useState<readonly TokenItem[]>([]);
  const [created, setCreated] = useState<CreatedToken | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const documentsResponse = await fetch(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}/documents?limit=50`, { cache: "no-store" });
    const documentsBody = await documentsResponse.json() as { ok?: boolean; data?: { items?: readonly DocumentItem[] } };
    const document = documentsBody.data?.items?.find((item) => item.revisionId === revisionId && item.status === "generated");
    if (!documentsResponse.ok || !document) throw new Error("GENERATED_DOCUMENT_NOT_FOUND");
    setDocumentId(document.id);
    const tokensResponse = await fetch(`/api/v2/work-orders/documents/${encodeURIComponent(document.id)}/access-tokens`, { cache: "no-store" });
    const tokensBody = await tokensResponse.json() as { ok?: boolean; data?: { items?: readonly TokenItem[] } };
    if (!tokensResponse.ok || !tokensBody.ok) throw new Error("TOKEN_LIST_FAILED");
    setItems(tokensBody.data?.items ?? []);
  }, [revisionId, workOrderId]);

  const toggle = () => {
    const next = !open;
    setMessage(null);
    setOpen(next);
    if (next) void load().catch(() => setMessage("공유 정보를 불러오지 못했습니다."));
  };

  const create = async () => {
    if (!documentId) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/v2/work-orders/documents/${encodeURIComponent(documentId)}/access-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ expiresInDays: 7 }),
      });
      const body = await response.json() as { ok?: boolean; data?: CreatedToken };
      if (!response.ok || !body.ok || !body.data) throw new Error("TOKEN_CREATE_FAILED");
      setCreated(body.data);
      await load();
    } catch {
      setMessage("공유 링크를 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (tokenId: string) => {
    if (!documentId) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v2/work-orders/documents/${encodeURIComponent(documentId)}/access-tokens/${encodeURIComponent(tokenId)}/revoke`, { method: "POST" });
      if (!response.ok) throw new Error("TOKEN_REVOKE_FAILED");
      if (created?.tokenId === tokenId) setCreated(null);
      await load();
    } catch {
      setMessage("공유 링크를 회수하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const rotate = async (tokenId: string) => {
    if (!documentId) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/v2/work-orders/documents/${encodeURIComponent(documentId)}/access-tokens/${encodeURIComponent(tokenId)}/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ expiresInDays: 7 }),
      });
      const body = await response.json() as { ok?: boolean; data?: CreatedToken };
      if (!response.ok || !body.ok || !body.data) throw new Error("TOKEN_ROTATE_FAILED");
      setCreated(body.data);
      await load();
    } catch {
      setMessage("공유 링크를 재발급하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      <button type="button" className={styles.trigger} onClick={toggle} title="공유">
        <Share2 aria-hidden="true"/><span>공유</span>
      </button>
      {open && <section className={styles.panel} aria-label="문서 공유">
        <header><div><strong>문서 공유</strong><span>기본 만료 7일</span></div><button type="button" onClick={create} disabled={!documentId || busy}>링크 만들기</button></header>
        {message && <p className={styles.message}>{message}</p>}
        {created && <div className={styles.created}>
          <div className={styles.qr} dangerouslySetInnerHTML={{ __html: created.qrSvg }}/>
          <div><strong>새 공유 링크</strong><span>{new Date(created.expiresAt).toLocaleDateString("ko-KR")}까지</span>
            <button type="button" onClick={() => navigator.clipboard.writeText(created.viewerUrl)}><Copy aria-hidden="true"/>링크 복사</button>
          </div>
        </div>}
        <div className={styles.history}>
          {items.length === 0 && <p>생성된 공유 링크가 없습니다.</p>}
          {items.map((item) => <div key={item.tokenId} className={styles.row}>
            <div><strong>{item.status === "active" ? "활성" : item.status === "expired" ? "만료" : "회수"}</strong><span>열람 {item.accessCount}회 · 만료 {new Date(item.expiresAt).toLocaleDateString("ko-KR")}</span><span>마지막 열람 {item.lastAccessedAt ? new Date(item.lastAccessedAt).toLocaleString("ko-KR") : "없음"}</span></div>
            {item.status === "active" && <div className={styles.actions}>
              <button type="button" onClick={() => rotate(item.tokenId)} disabled={busy} title="링크 재발급"><RefreshCw aria-hidden="true"/></button>
              <button type="button" onClick={() => revoke(item.tokenId)} disabled={busy} title="링크 회수"><Link2Off aria-hidden="true"/></button>
            </div>}
          </div>)}
        </div>
        <p className={styles.qrNote}><QrCode aria-hidden="true"/>QR은 동일한 공유 링크를 담습니다.</p>
      </section>}
    </div>
  );
}

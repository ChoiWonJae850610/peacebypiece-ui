"use client";

import { useEffect, useMemo, useState } from "react";

import { WaflButton } from "@/components/common/ui/WaflButton";
import type { MobileConnectIssueResponse } from "@/lib/mobile-dev-session/types";

function secondsUntil(expiresAt: string, now: number) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
}

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function MobileConnectClient() {
  const [issued, setIssued] = useState<MobileConnectIssueResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const remaining = useMemo(() => issued ? secondsUntil(issued.expiresAt, now) : 0, [issued, now]);

  useEffect(() => {
    if (!issued || remaining === 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [issued, remaining]);

  async function issueCode() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/dev/mobile-connect/code", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });
      const body = await response.json().catch(() => null) as MobileConnectIssueResponse | { message?: string } | null;
      if (!response.ok || !body || !("ok" in body) || body.ok !== true || !("code" in body)) {
        setIssued(null);
        setMessage(body && "message" in body && body.message ? body.message : "개발용 연결 코드를 발급할 수 없습니다.");
        return;
      }
      setIssued(body);
      setNow(Date.now());
    } catch {
      setIssued(null);
      setMessage("연결 코드 발급 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--pbp-page-background)] px-4 py-10 text-[var(--pbp-text-primary)]">
      <section className="mx-auto max-w-xl rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--pbp-text-muted)]">WAFL DEV/TEST</p>
        <h1 className="mt-2 text-2xl font-black">개발용 연결</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--pbp-text-secondary)]">
          이 화면은 운영 로그인 화면이 아닙니다. 현재 승인된 dev/test 회사 읽기 세션을 iPhone WAFL 앱에 한 번 연결합니다.
        </p>

        {issued ? (
          <div className="mt-6 space-y-4 rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-5">
            <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-[var(--pbp-text-muted)]">사용자</dt><dd className="font-semibold">{issued.effectiveUserName}</dd>
              <dt className="text-[var(--pbp-text-muted)]">회사</dt><dd className="font-semibold">{issued.effectiveCompanyName}</dd>
              <dt className="text-[var(--pbp-text-muted)]">역할</dt><dd className="font-semibold">{issued.effectiveRoleLabel}</dd>
              <dt className="text-[var(--pbp-text-muted)]">상태</dt><dd className="font-semibold">{remaining > 0 ? "사용 대기" : "만료"}</dd>
              <dt className="text-[var(--pbp-text-muted)]">남은 시간</dt><dd className="font-mono font-bold">{formatRemaining(remaining)}</dd>
            </dl>
            <div aria-label="개발용 연결 코드" className="rounded-xl bg-slate-950 px-4 py-5 text-center font-mono text-3xl font-black tracking-[0.25em] text-white">
              {issued.code}
            </div>
            <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">코드는 1회만 사용할 수 있으며 연결 성공 즉시 소비됩니다.</p>
          </div>
        ) : null}

        {message ? <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{message}</p> : null}

        <div className="mt-6 flex justify-end">
          <WaflButton variant="primary" onClick={issueCode} disabled={loading}>
            {loading ? "발급 중…" : issued ? "새 코드 발급" : "연결 코드 발급"}
          </WaflButton>
        </div>
      </section>
    </main>
  );
}

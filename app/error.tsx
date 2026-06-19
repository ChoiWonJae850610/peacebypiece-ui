"use client";

import { useEffect } from "react";

export default function GlobalErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--pbp-surface-page)] px-6">
      <section className="w-full max-w-lg rounded-[var(--pbp-radius-2xl)] border border-[var(--pbp-border-default)] bg-[var(--pbp-surface-panel)] p-8 text-center shadow-[var(--pbp-shadow-card)]">
        <p className="text-xs font-black tracking-[0.18em] text-[var(--pbp-status-danger-text)]">ERROR</p>
        <h1 className="mt-3 text-2xl font-black text-[var(--pbp-text-primary)]">화면을 불러오지 못했습니다.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--pbp-text-secondary)]">입력 내용이 저장됐는지 확인한 뒤 다시 시도해 주세요. 같은 문제가 반복되면 관리자에게 오류 발생 시각을 전달해 주세요.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-[var(--pbp-radius-lg)] bg-[var(--pbp-action-primary-surface)] px-4 py-2.5 text-sm font-black text-[var(--pbp-action-primary-text)]">다시 시도</button>
      </section>
    </main>
  );
}

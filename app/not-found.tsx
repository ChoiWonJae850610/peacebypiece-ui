import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--pbp-surface-page)] px-6">
      <section className="w-full max-w-lg rounded-[var(--pbp-radius-2xl)] border border-[var(--pbp-border-default)] bg-[var(--pbp-surface-panel)] p-8 text-center shadow-[var(--pbp-shadow-card)]">
        <p className="text-xs font-black tracking-[0.18em] text-[var(--pbp-text-muted)]">404</p>
        <h1 className="mt-3 text-2xl font-black text-[var(--pbp-text-primary)]">페이지를 찾을 수 없습니다.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--pbp-text-secondary)]">주소가 변경됐거나 삭제된 데이터일 수 있습니다. 이전 화면으로 돌아가거나 업무 홈에서 다시 확인해 주세요.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/workspace" className="rounded-[var(--pbp-radius-lg)] bg-[var(--pbp-action-primary-surface)] px-4 py-2.5 text-sm font-black text-[var(--pbp-action-primary-text)]">업무 홈</Link>
          <Link href="/login" className="rounded-[var(--pbp-radius-lg)] border border-[var(--pbp-border-default)] px-4 py-2.5 text-sm font-bold text-[var(--pbp-text-primary)]">로그인</Link>
        </div>
      </section>
    </main>
  );
}

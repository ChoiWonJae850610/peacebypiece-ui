export default function AdminInvitationOnboardingEntry() {
  return (
    <section className="rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--pbp-accent)]">Company onboarding</p>
      <h2 className="mt-3 text-xl font-bold tracking-tight text-[var(--pbp-text-primary)]">고객사 정보를 입력해 주세요.</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pbp-text-muted)]">
        초대 링크를 통해 Google 로그인한 상태입니다. 회사 정보와 관리자 정보를 입력하고 승인 요청을 완료하면 시스템관리자 검토 목록에 표시됩니다.
      </p>
    </section>
  );
}

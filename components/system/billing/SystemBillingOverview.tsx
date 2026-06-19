import { AdminLinkButton } from "@/components/admin/common/AdminButton";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import SystemShell from "@/components/system/layout/SystemShell";
import {
  SYSTEM_BODY_TEXT_CLASS,
  SYSTEM_CARD_CLASS,
  SYSTEM_EYEBROW_CLASS,
  SYSTEM_HEADER_PANEL_CLASS,
  SYSTEM_MUTED_CARD_CLASS,
  SYSTEM_PROGRESS_TRACK_CLASS,
  SYSTEM_SECTION_TITLE_CLASS,
  SYSTEM_SMALL_TEXT_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_VALUE_TEXT_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { getSystemDashboardStats } from "@/lib/system/systemDashboardStats";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index >= 3 ? 1 : 0)} ${units[index]}`;
}

function formatDate(value: string | null) {
  if (!value) return "활동 없음";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function SystemBillingOverview() {
  let dashboard = null;
  let errorMessage: string | null = null;

  try {
    dashboard = await getSystemDashboardStats();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "요금제·용량 정보를 불러오지 못했습니다.";
  }

  return (
    <SystemShell contentClassName="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-6">
      <header className={SYSTEM_HEADER_PANEL_CLASS}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className={SYSTEM_EYEBROW_CLASS}>SYSTEM BILLING</p>
            <div className="space-y-2">
              <h1 className={SYSTEM_TITLE_CLASS}>고객별 요금제·용량</h1>
              <p className={SYSTEM_SUBTITLE_CLASS}>
                실제 구독·저장용량 집계를 기준으로 고객사별 사용 현황을 확인합니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminStatusBadge tone="warning">요금제 변경 미완성</AdminStatusBadge>
            <AdminLinkButton href="/system" size="sm">시스템 콘솔</AdminLinkButton>
          </div>
        </div>
      </header>

      {errorMessage ? (
        <section className="rounded-2xl border border-[var(--pbp-status-danger)] bg-[var(--pbp-status-danger-soft)] p-5">
          <h2 className="text-sm font-semibold text-[var(--pbp-status-danger)]">데이터 조회 실패</h2>
          <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>{errorMessage}</p>
        </section>
      ) : null}

      {dashboard ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <article className={SYSTEM_CARD_CLASS}>
              <p className={SYSTEM_SMALL_TEXT_CLASS}>전체 고객사</p>
              <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{dashboard.totals.companies}곳</p>
              <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>활성 {dashboard.totals.activeCompanies} · 비활성 {dashboard.totals.inactiveCompanies}</p>
            </article>
            <article className={SYSTEM_CARD_CLASS}>
              <p className={SYSTEM_SMALL_TEXT_CLASS}>전체 저장용량</p>
              <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{formatBytes(dashboard.totals.storageUsedBytes)}</p>
              <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>한도 {formatBytes(dashboard.totals.storageLimitBytes)}</p>
            </article>
            <article className={SYSTEM_CARD_CLASS}>
              <p className={SYSTEM_SMALL_TEXT_CLASS}>용량 주의 고객사</p>
              <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{dashboard.totals.storageRiskCompanies}곳</p>
              <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>저장 한도의 70% 이상</p>
            </article>
            <article className={SYSTEM_CARD_CLASS}>
              <p className={SYSTEM_SMALL_TEXT_CLASS}>승인 멤버</p>
              <p className={`mt-3 text-2xl font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{dashboard.totals.members}명</p>
              <p className={`mt-2 ${SYSTEM_SMALL_TEXT_CLASS}`}>company_members 승인 상태 기준</p>
            </article>
          </section>

          <section className={SYSTEM_CARD_CLASS}>
            <div className="flex flex-col gap-2 border-b border-[var(--pbp-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className={SYSTEM_SECTION_TITLE_CLASS}>고객사별 요금제·용량 현황</h2>
                <p className={`mt-1 ${SYSTEM_BODY_TEXT_CLASS}`}>샘플 값 없이 현재 DB에서 조회한 최대 12개 고객사를 표시합니다.</p>
              </div>
              <p className={SYSTEM_SMALL_TEXT_CLASS}>집계 {formatDate(dashboard.generatedAt)}</p>
            </div>

            <div className="mt-4 space-y-3">
              {dashboard.companies.length === 0 ? (
                <div className={SYSTEM_MUTED_CARD_CLASS}><p className={SYSTEM_SMALL_TEXT_CLASS}>등록된 고객사가 없습니다.</p></div>
              ) : dashboard.companies.map((company) => (
                <article key={company.id} className={SYSTEM_MUTED_CARD_CLASS}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className={`text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{company.name}</h3>
                      <p className={`mt-1 ${SYSTEM_SMALL_TEXT_CLASS}`}>
                        {company.planCode} · 멤버 {company.memberCount}명 · 작업지시서 {company.workOrderCount}건
                      </p>
                      <p className={`mt-1 ${SYSTEM_SMALL_TEXT_CLASS}`}>최근 활동 {formatDate(company.lastActivityAt)}</p>
                    </div>
                    {company.storagePercent >= 100 ? (
                      <AdminStatusBadge tone="danger">용량 초과</AdminStatusBadge>
                    ) : company.storagePercent >= 70 ? (
                      <AdminStatusBadge tone="warning">용량 주의</AdminStatusBadge>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--pbp-text-muted)]">
                      <span>저장용량</span>
                      <span>{formatBytes(company.storageUsedBytes)} / {formatBytes(company.storageLimitBytes)} · {company.storagePercent}%</span>
                    </div>
                    <div className={`mt-2 h-2 rounded-full ${SYSTEM_PROGRESS_TRACK_CLASS}`}>
                      <div
                        className={`h-2 rounded-full ${company.storagePercent >= 100 ? "bg-[var(--pbp-status-danger)]" : company.storagePercent >= 70 ? "bg-[var(--pbp-status-warning)]" : "bg-[var(--pbp-brand-primary)]"}`}
                        style={{ width: `${Math.min(company.storagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <article className={SYSTEM_CARD_CLASS}>
              <h2 className={SYSTEM_SECTION_TITLE_CLASS}>요금제 분포</h2>
              <div className="mt-4 space-y-2">
                {dashboard.planDistribution.length === 0 ? (
                  <div className={SYSTEM_MUTED_CARD_CLASS}><p className={SYSTEM_SMALL_TEXT_CLASS}>요금제 데이터가 없습니다.</p></div>
                ) : dashboard.planDistribution.map((plan) => (
                  <div key={plan.planCode} className={`${SYSTEM_MUTED_CARD_CLASS} flex items-center justify-between gap-3`}>
                    <span className="text-sm text-[var(--pbp-text-muted)]">{plan.planCode}</span>
                    <strong className={SYSTEM_VALUE_TEXT_CLASS}>{plan.companyCount}곳</strong>
                  </div>
                ))}
              </div>
            </article>
            <article className={SYSTEM_CARD_CLASS}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className={SYSTEM_SECTION_TITLE_CLASS}>요금제 변경 정책</h2>
                  <p className={`mt-2 ${SYSTEM_BODY_TEXT_CLASS}`}>
                    실제 변경·과금·적용일 정책이 확정되기 전까지 이 화면은 조회 전용입니다. 임의의 변경 미리보기나 저장 버튼은 표시하지 않습니다.
                  </p>
                </div>
                <AdminStatusBadge tone="warning">미완성</AdminStatusBadge>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </SystemShell>
  );
}

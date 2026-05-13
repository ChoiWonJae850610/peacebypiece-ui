import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import type { AdminCompletionAuditStatus, AdminCompletionAuditSummary } from "@/lib/admin/completionAudit";
import { getAdminCompletionAuditStatusPresentation } from "@/lib/admin/completionAudit";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminCompletionAuditPanelProps = {
  summary: AdminCompletionAuditSummary;
};

function getCompletionAuditStatusTone(status: AdminCompletionAuditStatus): AdminStatusBadgeTone {
  if (status === "complete") return "success";
  if (status === "blocked") return "danger";
  return "warning";
}

export default function AdminCompletionAuditPanel({ summary }: AdminCompletionAuditPanelProps) {
  const t = useAdminTranslation();
  const overallStatusPresentation = getAdminCompletionAuditStatusPresentation(summary.overallStatus);

  return (
    <AdminCard className="mt-5">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-stone-950">{t("completionAudit.title", "관리자 완료 검증")}</h2>
            <AdminStatusBadge tone={getCompletionAuditStatusTone(summary.overallStatus)}>
              {overallStatusPresentation.label}
            </AdminStatusBadge>
          </div>
          <p className="mt-1 text-xs text-stone-500">{t("completionAudit.description", "관리자 영역을 WorkOrder 리팩토링 전 마감 가능한 상태인지 점검합니다.")}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          <AdminStatusBadge tone="neutral">{t("completionAudit.chips.domain", "구조")} {summary.readyDomainCount}/{summary.totalDomainCount}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">{t("completionAudit.chips.legacyRemoved", "이전 경로 제거")} {summary.removedLegacyCount}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">{t("completionAudit.chips.legacyKept", "이전 경로 유지")} {summary.retainedLegacyCount}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">{t("completionAudit.chips.db", "데이터")} {summary.dbConnectedCount}+{summary.dbWatchCount}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">{t("completionAudit.chips.sample", "샘플")} {summary.mockRemoveReadyCount}/{summary.mockRetainedCount}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">{t("completionAudit.chips.finalAudit", "마감점검")} {summary.finalAuditWatchCount}/{summary.finalAuditTotalCount}</AdminStatusBadge>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-100 bg-white px-4 py-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{t("completionAudit.decision", "완료 판정")}</p>
            <h3 className="mt-1 text-base font-semibold text-stone-950">{summary.decisionLabel}</h3>
            <p className="mt-1 text-xs leading-5 text-stone-500">{summary.decisionSummary}</p>
          </div>
          <AdminStatusBadge tone={getCompletionAuditStatusTone(summary.overallStatus)}>
            {overallStatusPresentation.label}
          </AdminStatusBadge>
        </div>
        <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-500">{summary.nextScope}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {summary.items.map((item) => {
          const statusPresentation = getAdminCompletionAuditStatusPresentation(item.status);

          return (
            <article key={item.key} className="rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-stone-950">{item.label}</h3>
                  <p className="mt-1 text-xs font-semibold text-stone-500">{item.summary}</p>
                </div>
                <AdminStatusBadge tone={getCompletionAuditStatusTone(item.status)}>
                  {statusPresentation.label}
                </AdminStatusBadge>
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">{item.detail}</p>
            </article>
          );
        })}
      </div>
    </AdminCard>
  );
}

import { AdminCard } from "@/components/admin/layout/AdminCard";
import type { AdminCompletionAuditStatus, AdminCompletionAuditSummary } from "@/lib/admin/completionAudit";
import { getAdminCompletionAuditStatusLabel } from "@/lib/admin/completionAudit";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminCompletionAuditPanelProps = {
  summary: AdminCompletionAuditSummary;
};

function getStatusClassName(status: AdminCompletionAuditStatus): string {
  if (status === "complete") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "watch") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-rose-50 text-rose-700 ring-rose-100";
}

export default function AdminCompletionAuditPanel({ summary }: AdminCompletionAuditPanelProps) {
  const t = useAdminTranslation();
  return (
    <AdminCard className="mt-5">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-stone-950">{t("completionAudit.title", "관리자 완료 검증")}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClassName(summary.overallStatus)}`}>
              {getAdminCompletionAuditStatusLabel(summary.overallStatus)}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">{t("completionAudit.description", "관리자 영역을 WorkOrder 리팩토링 전 마감 가능한 상태인지 점검합니다.")}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-stone-500 lg:grid-cols-4">
          <span className="rounded-full bg-stone-100 px-3 py-1.5">domain {summary.readyDomainCount}/{summary.totalDomainCount}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5">legacy removed {summary.removedLegacyCount}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5">legacy kept {summary.retainedLegacyCount}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5">db {summary.dbConnectedCount}+{summary.dbWatchCount}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-stone-100 bg-white px-4 py-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{t("completionAudit.decision", "완료 판정")}</p>
            <h3 className="mt-1 text-base font-semibold text-stone-950">{summary.decisionLabel}</h3>
            <p className="mt-1 text-xs leading-5 text-stone-500">{summary.decisionSummary}</p>
          </div>
          <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClassName(summary.overallStatus)}`}>
            {getAdminCompletionAuditStatusLabel(summary.overallStatus)}
          </span>
        </div>
        <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-500">{summary.nextScope}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {summary.items.map((item) => (
          <article key={item.key} className="rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-stone-950">{item.label}</h3>
                <p className="mt-1 text-xs font-semibold text-stone-500">{item.summary}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClassName(item.status)}`}>
                {getAdminCompletionAuditStatusLabel(item.status)}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-stone-500">{item.detail}</p>
          </article>
        ))}
      </div>
    </AdminCard>
  );
}

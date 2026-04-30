import { AdminCard } from "@/components/admin/layout/AdminCard";
import type { AdminDbCompletionSummary, AdminDbScreenAuditStatus } from "@/lib/admin/dbCompletionAudit";
import { getAdminDbCompletionStatusLabel, getAdminDbSourceTypeLabel } from "@/lib/admin/dbCompletionAudit";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminDbConnectionAuditPanelProps = {
  summary: AdminDbCompletionSummary;
};


function getRepositoryModeLabel(mode: string): string {
  return mode === "db" ? "실제 데이터" : "샘플 데이터";
}

function getStatusClassName(status: AdminDbScreenAuditStatus): string {
  if (status === "db-connected") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (status === "db-prepared") return "bg-amber-50 text-amber-700 ring-amber-100";
  if (status === "fallback-guarded") return "bg-sky-50 text-sky-700 ring-sky-100";
  if (status === "mock-only") return "bg-stone-100 text-stone-600 ring-stone-200";
  return "bg-stone-100 text-stone-500 ring-stone-200";
}

export default function AdminDbConnectionAuditPanel({ summary }: AdminDbConnectionAuditPanelProps) {
  const t = useAdminTranslation();
  return (
    <AdminCard className="mt-5">
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">{t("dbConnectionAudit.title", "데이터 연결 점검")}</h2>
          <p className="mt-1 text-xs text-stone-500">{t("dbConnectionAudit.description", "관리자 화면별 실제 데이터 조회/저장 경계와 안전 표시 상태입니다.")}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
          <span className="rounded-full bg-stone-100 px-3 py-1.5">{t("dbConnectionAudit.repository.workorder", "작업지시서")} {getRepositoryModeLabel(summary.repositoryModes.workorder)}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5">{t("dbConnectionAudit.repository.partner", "협력업체")} {getRepositoryModeLabel(summary.repositoryModes.partner)}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5">{t("dbConnectionAudit.repository.attachmentMemo", "메모/첨부")} {getRepositoryModeLabel(summary.repositoryModes.attachmentMemo)}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {summary.items.map((item) => (
          <article key={item.key} className="rounded-2xl border border-stone-100 bg-stone-50/70 px-4 py-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-stone-950">{item.screen}</h3>
                <p className="mt-1 truncate text-xs text-stone-400">{item.routePath}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClassName(item.status)}`}>
                  {getAdminDbCompletionStatusLabel(item.status)}
                </span>
                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200">
                  {getAdminDbSourceTypeLabel(item.sourceType)}
                </span>
              </div>
            </div>
            <dl className="mt-3 grid gap-2 text-xs text-stone-500 lg:grid-cols-2">
              <div>
                <dt className="font-semibold text-stone-700">{t("dbConnectionAudit.read", "조회")}</dt>
                <dd className="mt-1">{item.readSource}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-700">{t("dbConnectionAudit.write", "저장")}</dt>
                <dd className="mt-1">{item.writeSource}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-700">{t("dbConnectionAudit.alternateDisplay", "안전 표시")}</dt>
                <dd className="mt-1">{item.alternateDisplay}</dd>
              </div>
              <div>
                <dt className="font-semibold text-stone-700">{t("dbConnectionAudit.nextCheck", "다음 확인")}</dt>
                <dd className="mt-1">{item.nextCheck}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </AdminCard>
  );
}

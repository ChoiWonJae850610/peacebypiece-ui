import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import { WaflSurface } from "@/components/common/ui";
import type { AdminDbCompletionSummary, AdminDbScreenAuditSourceType, AdminDbScreenAuditStatus } from "@/lib/admin/dbCompletionAudit";
import { getAdminDbCompletionStatusPresentation, getAdminDbSourceTypeLabel, getAdminRepositoryModeLabel } from "@/lib/admin/dbCompletionAudit";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminDbConnectionAuditPanelProps = {
  summary: AdminDbCompletionSummary;
};

type AdminT = ReturnType<typeof useAdminTranslation>;


function getDbStatusTone(status: AdminDbScreenAuditStatus): AdminStatusBadgeTone {
  if (status === "db-connected") return "success";
  if (status === "db-prepared") return "warning";
  if (status === "empty-state-guarded") return "info";
  return "neutral";
}

function getDbSourceTypeTone(sourceType: AdminDbScreenAuditSourceType): AdminStatusBadgeTone {
  if (sourceType === "actual-db") return "success";
  if (sourceType === "db-with-empty-state") return "info";
  if (sourceType === "db-prepared-empty-state") return "warning";
  return "neutral";
}

function translateRepositoryMode(mode: string, t: AdminT) {
  return t(`dbConnectionAudit.repositoryModes.${mode}`, getAdminRepositoryModeLabel(mode as Parameters<typeof getAdminRepositoryModeLabel>[0]));
}

function translateSourceType(sourceType: string, t: AdminT) {
  return t(`dbConnectionAudit.sourceTypes.${sourceType}`, getAdminDbSourceTypeLabel(sourceType as Parameters<typeof getAdminDbSourceTypeLabel>[0]));
}

function translateStatusLabel(status: string, fallback: string, t: AdminT) {
  return t(`dbConnectionAudit.statuses.${status}`, fallback);
}

export default function AdminDbConnectionAuditPanel({ summary }: AdminDbConnectionAuditPanelProps) {
  const t = useAdminTranslation();
  return (
    <AdminCard className="mt-5">
      <div className="flex flex-col gap-3 border-b border-[var(--pbp-border)] pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--pbp-text-primary)]">{t("dbConnectionAudit.title", "데이터 연결 점검")}</h2>
          <p className="mt-1 text-xs text-[var(--pbp-text-muted)]">{t("dbConnectionAudit.description", "관리자 화면별 실제 데이터 조회/저장 경계와 안전 표시 상태입니다.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="neutral">{t("dbConnectionAudit.repository.workorder", "작업지시서")} {translateRepositoryMode(summary.repositoryModes.workorder, t)}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">{t("dbConnectionAudit.repository.partner", "협력업체")} {translateRepositoryMode(summary.repositoryModes.partner, t)}</AdminStatusBadge>
          <AdminStatusBadge tone="neutral">{t("dbConnectionAudit.repository.attachmentMemo", "메모/첨부")} {translateRepositoryMode(summary.repositoryModes.attachmentMemo, t)}</AdminStatusBadge>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {summary.items.map((item) => {
          const statusPresentation = getAdminDbCompletionStatusPresentation(item.status);

          return (
            <WaflSurface as="article" key={item.key} component="db-connection-audit-item" shape="control" tone="muted" className="px-4 py-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--pbp-text-primary)]">{item.screen}</h3>
                  <p className="mt-1 truncate text-xs text-[var(--pbp-text-subtle)]">{item.routePath}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdminStatusBadge tone={getDbStatusTone(item.status)}>
                    {translateStatusLabel(item.status, statusPresentation.label, t)}
                  </AdminStatusBadge>
                  <AdminStatusBadge tone={getDbSourceTypeTone(item.sourceType)}>
                    {translateSourceType(item.sourceType, t)}
                  </AdminStatusBadge>
                </div>
              </div>
              <dl className="mt-3 grid gap-2 text-xs text-[var(--pbp-text-muted)] lg:grid-cols-2">
                <div>
                  <dt className="font-semibold text-[var(--pbp-text-primary)]">{t("dbConnectionAudit.read", "조회")}</dt>
                  <dd className="mt-1">{item.readSource}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--pbp-text-primary)]">{t("dbConnectionAudit.write", "저장")}</dt>
                  <dd className="mt-1">{item.writeSource}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--pbp-text-primary)]">{t("dbConnectionAudit.alternateDisplay", "안전 표시")}</dt>
                  <dd className="mt-1">{item.alternateDisplay}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--pbp-text-primary)]">{t("dbConnectionAudit.nextCheck", "다음 확인")}</dt>
                  <dd className="mt-1">{item.nextCheck}</dd>
                </div>
              </dl>
            </WaflSurface>
          );
        })}
      </div>
    </AdminCard>
  );
}

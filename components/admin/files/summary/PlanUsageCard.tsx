import { AdminButton } from "@/components/admin/common/AdminButton";
import {
  ADMIN_STORAGE_CARD_MUTED_CLASS,
  ADMIN_STORAGE_LABEL_CLASS,
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_VALUE_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type { AdminStorageUsageSummary } from "@/lib/admin/files/types";
import { formatStorageBytes } from "@/lib/admin/files/storageSummaryPresentation";
import { formatPbpFixedGigabytes } from "@/lib/utils/formatters";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

import { StorageCylinder } from "./StorageCylinder";

export function PlanUsageCard({
  usageSummary,
  statusLabel,
}: {
  usageSummary: AdminStorageUsageSummary;
  statusLabel: string;
}) {
  const hasPlanLimit = Number.isFinite(usageSummary.limitBytes) && usageSummary.limitBytes > 0;
  const usedGbLabel = formatPbpFixedGigabytes(usageSummary.usedBytes, 2);
  const remainingBytes = hasPlanLimit ? Math.max(0, usageSummary.limitBytes - usageSummary.usedBytes) : 0;
  const t = useAdminTranslation();
  const remainingLabel = hasPlanLimit ? formatStorageBytes(remainingBytes) : t("filesSummary.planCapacityPending", "요금제 확인 중");
  const planName = hasPlanLimit ? t("filesSummary.currentPlan", "현재 요금제") : t("filesSummary.pendingPlan", "확인 중");
  const isDanger = hasPlanLimit && usageSummary.statusTone === "danger";
  const isCaution = hasPlanLimit && usageSummary.statusTone === "caution";

  return (
    <div className={`${ADMIN_STORAGE_CARD_MUTED_CLASS} flex h-full min-h-[138px] flex-col px-4 py-3 md:min-h-[148px] md:px-4 md:py-3.5 2xl:min-h-[156px] 2xl:px-5`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className={ADMIN_STORAGE_LABEL_CLASS}>
            {t("filesSummary.storagePlanLabel", "요금제 용량")}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[var(--admin-theme-surface)] px-3 py-1 text-xs font-bold text-[var(--pbp-action-primary-text)]">
              {planName}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDanger ? "bg-[var(--pbp-status-danger-soft)] text-[var(--pbp-status-danger)]" : isCaution ? "bg-[var(--pbp-status-warning-soft)] text-[var(--pbp-status-warning)]" : "bg-[var(--pbp-action-primary-surface)] text-[var(--pbp-action-primary-text)]"}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
        <AdminButton
          size="sm"
          title={t("filesSummary.upgradeTitle", "요금제 업그레이드 화면은 후속 버전에서 연결합니다.")}
          className="w-full sm:w-auto"
        >
          {t("filesSummary.upgrade", "업그레이드")}
        </AdminButton>
      </div>

      <StorageCylinder percent={hasPlanLimit ? usageSummary.usagePercent : 0} />

      <div className="mt-3 text-center">
        <p className={`${ADMIN_STORAGE_VALUE_CLASS} text-lg tracking-tight`}>
          {hasPlanLimit ? `${usageSummary.usedLabel} / ${usageSummary.limitLabel}` : t("filesSummary.planCapacityLoading", "요금제 용량 확인 중")}
        </p>
        <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} mt-0.5 text-[11px] font-semibold`}>
          {hasPlanLimit ? `${usedGbLabel} ${t("filesSummary.usedSuffix", "사용")} · ${remainingLabel} ${t("filesSummary.remainingSuffix", "남음")}` : t("filesSummary.planCapacityLoadingDescription", "고객 정보의 요금제 용량을 불러오는 중")}
        </p>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--pbp-surface)] shadow-inner">
        <div
          className={`h-full rounded-full ${isDanger ? "bg-[var(--pbp-status-danger)]" : isCaution ? "bg-[var(--pbp-status-warning)]" : "bg-[var(--admin-theme-surface)]"}`}
          style={{ width: `${hasPlanLimit ? Math.min(100, Math.max(0, usageSummary.usagePercent)) : 0}%` }}
        />
      </div>
    </div>
  );
}

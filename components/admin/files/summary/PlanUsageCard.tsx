import { AdminButton } from "@/components/admin/common/AdminButton";
import { ADMIN_STORAGE_LABEL_CLASS } from "@/components/admin/common/adminSemanticClassNames";
import WaflBadge from "@/components/common/ui/WaflBadge";
import WaflStorageUsageMeter from "@/components/common/ui/WaflStorageUsageMeter";
import { WaflSurface } from "@/components/common/ui/WaflSurface";
import type { AdminStorageUsageSummary } from "@/lib/admin/files/types";
import { formatStorageBytes } from "@/lib/admin/files/storageSummaryPresentation";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { formatPbpFixedGigabytes } from "@/lib/utils/formatters";

export function PlanUsageCard({
  usageSummary,
  statusLabel,
}: {
  usageSummary: AdminStorageUsageSummary;
  statusLabel: string;
}) {
  const t = useAdminTranslation();
  const hasPlanLimit =
    Number.isFinite(usageSummary.limitBytes) && usageSummary.limitBytes > 0;
  const usedGbLabel = formatPbpFixedGigabytes(usageSummary.usedBytes, 2);
  const remainingBytes = hasPlanLimit
    ? usageSummary.remainingBytes
    : 0;
  const remainingLabel = hasPlanLimit
    ? formatStorageBytes(remainingBytes)
    : t("filesSummary.planCapacityPending", "요금제 확인 중");
  const planName = hasPlanLimit
    ? t("filesSummary.currentPlan", "현재 요금제")
    : t("filesSummary.pendingPlan", "확인 중");
  const isDanger = hasPlanLimit && usageSummary.statusTone === "danger";
  const isCaution = hasPlanLimit && usageSummary.statusTone === "caution";

  return (
    <WaflSurface
      component="storage-plan-card"
      tone="muted"
      className="flex h-full min-h-[138px] flex-col px-4 py-3 md:min-h-[148px] md:px-4 md:py-3.5 2xl:min-h-[156px] 2xl:px-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className={ADMIN_STORAGE_LABEL_CLASS}>
            {t("filesSummary.storagePlanLabel", "요금제 용량")}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <WaflBadge tone="neutral" size="sm">
              {planName}
            </WaflBadge>
            <WaflBadge
              tone={isDanger ? "danger" : isCaution ? "warning" : "success"}
              size="sm"
            >
              {statusLabel}
            </WaflBadge>
          </div>
        </div>
        <AdminButton
          size="sm"
          title={t(
            "filesSummary.upgradeTitle",
            "요금제 업그레이드 화면은 후속 버전에서 연결합니다.",
          )}
          className="w-full sm:w-auto"
        >
          {t("filesSummary.upgrade", "업그레이드")}
        </AdminButton>
      </div>

      <WaflStorageUsageMeter
        showCylinder
        compact
        percent={hasPlanLimit ? usageSummary.displayUsagePercent : 0}
        usedLabel={
          hasPlanLimit
            ? usageSummary.usedLabel
            : t("filesSummary.planCapacityLoading", "요금제 용량 확인 중")
        }
        limitLabel={hasPlanLimit ? usageSummary.limitLabel : "-"}
        statusLabel={statusLabel}
        tone={isDanger ? "danger" : isCaution ? "caution" : "normal"}
        details={[
          {
            label: t("filesSummary.usedSuffix", "사용"),
            value: usedGbLabel,
            description: hasPlanLimit
              ? `${remainingLabel} ${t("filesSummary.remainingSuffix", "남음")}`
              : t(
                  "filesSummary.planCapacityLoadingDescription",
                  "고객 정보의 요금제 용량을 불러오는 중입니다.",
                ),
          },
        ]}
        className="mt-3 border-transparent bg-[var(--pbp-surface)]"
      />
    </WaflSurface>
  );
}

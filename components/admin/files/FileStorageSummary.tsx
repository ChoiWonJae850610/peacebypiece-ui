"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";
import {
  ADMIN_STORAGE_CARD_CLASS,
  ADMIN_STORAGE_CARD_MUTED_CLASS,
  ADMIN_STORAGE_LABEL_CLASS,
  ADMIN_STORAGE_MUTED_TEXT_CLASS,
  ADMIN_STORAGE_SUBTLE_BOX_CLASS,
  ADMIN_STORAGE_SUBTLE_TEXT_CLASS,
  ADMIN_STORAGE_VALUE_CLASS,
} from "@/components/admin/common/adminSemanticClassNames";
import type {
  AdminFileTypeDistributionItem,
  AdminFileUsageCard,
  AdminStorageUsageSummary,
} from "@/lib/admin/files/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
import { translateAdminFileTypeTerm } from "@/lib/i18n/adminTermFormatters";
import { getAdminChartColor } from "@/lib/admin/chartPalette";
import {
  buildFileStatusItems,
  formatCountWithUnit,
  formatStorageBytes,
  translateStorageStatus,
  type FileStatusItem,
} from "@/lib/admin/files/storageSummaryPresentation";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  fileTypeDistribution?: AdminFileTypeDistributionItem[];
};

function StorageCylinder({ percent }: { percent: number }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative mx-auto mt-2 h-[98px] w-[104px] 2xl:mt-2 2xl:h-[108px] 2xl:w-[112px]" aria-hidden="true">
      <div className="absolute inset-x-4 bottom-0 h-[80px] overflow-hidden rounded-b-[32px] border-x border-b border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-inner">
        <div
          className="absolute inset-x-0 bottom-0 rounded-b-[28px] bg-[var(--admin-theme-surface)]/20"
          style={{ height: `${Math.max(6, safePercent)}%` }}
        />
      </div>
      <div className="absolute inset-x-4 top-0 h-10 rounded-[50%] border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-sm" />
      <div
        className="absolute inset-x-4 rounded-[50%] border border-[var(--admin-theme-surface)] bg-[var(--admin-theme-surface)]/20"
        style={{ bottom: `${Math.max(0, Math.min(70, safePercent * 0.7))}px`, height: 34 }}
      />
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <span className="rounded-full bg-[var(--pbp-surface)]/90 px-3 py-1 text-base font-bold text-[var(--pbp-text-primary)] shadow-sm">
          {safePercent}%
        </span>
      </div>
    </div>
  );
}

function PlanUsageCard({
  usageSummary,
  statusLabel,
}: {
  usageSummary: AdminStorageUsageSummary;
  statusLabel: string;
}) {
  const hasPlanLimit = Number.isFinite(usageSummary.limitBytes) && usageSummary.limitBytes > 0;
  const usedGbLabel = `${(usageSummary.usedBytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  const remainingBytes = hasPlanLimit ? Math.max(0, usageSummary.limitBytes - usageSummary.usedBytes) : 0;
  const t = useAdminTranslation();
  const remainingLabel = hasPlanLimit ? formatStorageBytes(remainingBytes) : t("filesSummary.planCapacityPending", "요금제 확인 중");
  const planName = hasPlanLimit ? t("filesSummary.currentPlan", "현재 요금제") : t("filesSummary.pendingPlan", "확인 중");
  const isDanger = hasPlanLimit && usageSummary.statusTone === "danger";
  const isCaution = hasPlanLimit && usageSummary.statusTone === "caution";

  return (
    <div className={`${ADMIN_STORAGE_CARD_MUTED_CLASS} flex h-full min-h-[150px] flex-col px-4 py-3 md:min-h-[160px] md:px-4 md:py-4 2xl:min-h-[170px] 2xl:px-5`}>
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
          className="min-h-7 w-full px-2.5 py-1 text-[11px] sm:w-auto"
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

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--pbp-surface)] shadow-inner">
        <div
          className={`h-full rounded-full ${isDanger ? "bg-[var(--pbp-status-danger)]" : isCaution ? "bg-[var(--pbp-status-warning)]" : "bg-[var(--admin-theme-surface)]"}`}
          style={{ width: `${hasPlanLimit ? Math.min(100, Math.max(0, usageSummary.usagePercent)) : 0}%` }}
        />
      </div>
    </div>
  );
}

function FileOperationsCard({ items }: { items: FileStatusItem[] }) {
  const t = useAdminTranslation();
  return (
    <div className={`${ADMIN_STORAGE_CARD_CLASS} flex h-full min-h-[150px] flex-col px-4 py-3 md:min-h-[160px] md:px-4 md:py-4 2xl:min-h-[170px] 2xl:px-5`}>
      <div>
        <p className={ADMIN_STORAGE_LABEL_CLASS}>
          {t("filesSummary.fileOperationsLabel", "파일 운영")}
        </p>
        <h3 className={`${ADMIN_STORAGE_VALUE_CLASS} mt-1 text-sm`}>{t("filesSummary.fileOperationsTitle", "파일 운영 요약")}</h3>
      </div>
      <div className="mt-3 grid flex-1 content-center gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${ADMIN_STORAGE_SUBTLE_BOX_CLASS} flex items-center justify-between gap-3 px-3 py-2.5`}
          >
            <div className="min-w-0">
              <p className={`${ADMIN_STORAGE_VALUE_CLASS} truncate text-[13px] font-semibold`} title={item.label}>
                {item.label}
              </p>
              {item.description ? (
                <p className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} mt-0.5 truncate text-[11px]`} title={item.description}>
                  {item.description}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 text-sm font-bold ${item.tone === "danger" ? "text-[var(--pbp-status-danger)]" : item.tone === "caution" ? "text-[var(--pbp-status-warning)]" : "text-[var(--pbp-text-primary)]"}`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({
  items = [],
}: {
  items?: AdminFileTypeDistributionItem[];
}) {
  const t = useAdminTranslation();
  const normalizedItems = (
    items.length > 0
      ? items
      : [
          { label: t("terms.files.document", "문서"), value: 0, percent: 0 },
          { label: t("terms.files.design", "디자인"), value: 0, percent: 0 },
        ]
  ).map((item) => ({ ...item, label: translateAdminFileTypeTerm(item.label, t) }));
  const total = normalizedItems.reduce((sum, item) => sum + item.value, 0);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={`${ADMIN_STORAGE_CARD_CLASS} flex h-full min-h-[150px] flex-col px-4 py-3 md:min-h-[160px] md:px-4 md:py-4 2xl:min-h-[170px] 2xl:px-5`}>
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className={ADMIN_STORAGE_LABEL_CLASS}>
            {t("filesSummary.fileTypeLabel", "파일 유형")}
          </p>
          <h3 className={`${ADMIN_STORAGE_VALUE_CLASS} mt-1 text-sm`}>
            {t("filesSummary.fileType", "파일 유형")}
          </h3>
        </div>
        <span className="rounded-full bg-[var(--pbp-surface-muted)] px-2.5 py-1 text-xs font-bold text-[var(--pbp-text-muted)]">
          {formatCountWithUnit(total, t)}
        </span>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-7">
        <div className="relative h-[124px] w-[124px] shrink-0 2xl:h-[132px] 2xl:w-[132px]">
          <svg
            viewBox="0 0 148 148"
            className="h-[124px] w-[124px] -rotate-90 2xl:h-[132px] 2xl:w-[132px]"
            aria-hidden="true"
          >
            <circle
              cx="74"
              cy="74"
              r={radius}
              fill="none"
              stroke="var(--pbp-border)"
              strokeWidth="16"
            />
            {total > 0
              ? normalizedItems.map((item, index) => {
                  const dash = (item.value / total) * circumference;
                  const strokeDasharray = `${dash} ${circumference - dash}`;
                  const strokeDashoffset = -offset;
                  offset += dash;
                  return (
                    <circle
                      key={item.label}
                      cx="74"
                      cy="74"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="16"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="butt"
                      style={{ color: getAdminChartColor(index) }}
                    />
                  );
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`${ADMIN_STORAGE_VALUE_CLASS} text-2xl`}>{total}</span>
            <span className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[11px] font-semibold`}>{t("filesSummary.totalLabel", "전체")}</span>
          </div>
        </div>
        <div className="min-w-0 flex-[0.85] space-y-2">
          {normalizedItems.map((item, index) => (
            <div key={item.label} className="min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} flex min-w-0 items-center gap-2 font-semibold`}>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: getAdminChartColor(index) }}
                  />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </span>
                <span className={`${ADMIN_STORAGE_VALUE_CLASS} shrink-0 font-bold`}>
                  {formatCountWithUnit(item.value, t)} · {item.percent}%
                </span>
              </div>
              <div className="mt-1 h-1.5 max-w-[360px] overflow-hidden rounded-full bg-[var(--pbp-surface-muted)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(2, item.percent)}%`, backgroundColor: getAdminChartColor(index) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FileStorageSummary({
  usageCards,
  usageSummary,
  fileTypeDistribution = [],
}: FileStorageSummaryProps) {
  const t = useAdminTranslation();
  const statusLabel = translateStorageStatus(
    usageSummary.statusTone,
    usageSummary.statusLabel,
    t,
  );
  const statusItems = buildFileStatusItems({ usageCards, t });

  return (
    <section className="shrink-0 overflow-visible rounded-[24px] border border-[var(--pbp-border)] bg-[linear-gradient(135deg,var(--pbp-surface-soft),var(--pbp-surface))] p-3 shadow-sm md:rounded-[28px] md:p-4">
      <div className="flex flex-col gap-2 pb-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pbp-brand-soft)]">
            {t("filesSummary.visualEyebrow", "Storage control")}
          </p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[var(--pbp-text-primary)] md:text-xl 2xl:text-2xl">
            {t("filesSummary.visualTitle", "저장공간과 휴지통을 한 화면에서 관리합니다.")}
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--pbp-text-muted)] md:text-sm">
            {t("filesSummary.visualDescription", "사용량, 파일 유형, 휴지통 상태를 먼저 확인하고 필요한 복원·삭제 작업만 처리합니다.")}
          </p>
        </div>
        <span className="w-fit rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1.5 text-xs font-bold text-[var(--pbp-text-muted)] shadow-sm">
          {statusLabel}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:gap-3 2xl:grid-cols-3 2xl:grid-cols-[minmax(230px,0.78fr)_minmax(260px,0.88fr)_minmax(340px,1.12fr)]">
        <PlanUsageCard usageSummary={usageSummary} statusLabel={statusLabel} />
        <FileOperationsCard items={statusItems} />
        <div className="lg:col-span-2 2xl:col-span-1"><DonutChart items={fileTypeDistribution} /></div>
      </div>
    </section>
  );
}

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
import { formatAdminTermCount, translateAdminFileTypeTerm } from "@/lib/i18n/adminTermFormatters";

type FileStorageSummaryProps = {
  usageCards: AdminFileUsageCard[];
  usageSummary: AdminStorageUsageSummary;
  fileTypeDistribution?: AdminFileTypeDistributionItem[];
};

type FileStatusItem = {
  label: string;
  value: string;
  description?: string;
  tone?: "neutral" | "danger" | "caution";
};

function getUsageCardValue(
  cards: AdminFileUsageCard[],
  index: number,
  fallback = "-",
) {
  return cards[index]?.value ?? fallback;
}

function translateStorageValue(
  value: string,
  t: ReturnType<typeof useAdminTranslation>,
) {
  const countMatch = value.match(/^(\d+)\s*(개|items?)$/i);
  if (countMatch) {
    const unit = t("terms.units.item", "개");
    return unit === "개" ? `${countMatch[1]}${unit}` : `${countMatch[1]} ${unit}`;
  }
  const dayMatch = value.match(/^(\d+)일$/);
  if (dayMatch) {
    const unit = t("terms.units.day", "일");
    return unit === "일" ? `${dayMatch[1]}${unit}` : `${dayMatch[1]} ${unit}`;
  }
  return value;
}


function translateStorageDescription(
  value: string | undefined,
  t: ReturnType<typeof useAdminTranslation>,
  fallbackKey: string,
  fallback: string,
): string {
  const text = (value || fallback).trim();
  const normalized = text.toLowerCase();
  if (!text) return t(fallbackKey, fallback);
  if (normalized.includes("checking plan") || text === "요금제 용량 확인 중") return t("filesSummary.planCapacityLoading", "요금제 용량 확인 중");
  if (text.endsWith("처리 대기") || normalized.endsWith("waiting")) return `${text.replace(/\s*(처리 대기|waiting)$/i, "").trim()} ${t("filesSummary.waitingSuffix", "처리 대기")}`;
  if (text.endsWith("보관") || normalized.endsWith("stored")) return `${text.replace(/\s*(보관|stored)$/i, "").trim()} ${t("filesSummary.storedSuffix", "보관")}`;
  if (text.endsWith("사용") || normalized.endsWith("used")) return `${text.replace(/\s*(사용|used)$/i, "").trim()} ${t("filesSummary.usedSuffix", "사용")}`;
  return text;
}

function translateStorageStatus(
  tone: AdminStorageUsageSummary["statusTone"],
  fallback: string,
  t: ReturnType<typeof useAdminTranslation>,
) {
  if (tone === "danger") return t("filesSummary.statuses.danger", fallback);
  if (tone === "caution") return t("filesSummary.statuses.caution", fallback);
  return t("filesSummary.statuses.normal", fallback);
}


function formatCountWithUnit(
  count: number,
  t: ReturnType<typeof useAdminTranslation>,
): string {
  return formatAdminTermCount(t, count, "item");
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0MB";
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
  if (bytes >= 1024 * 1024) return `${Math.max(0.01, bytes / 1024 / 1024).toFixed(2)}MB`;
  if (bytes >= 1024) return `${Math.ceil(bytes / 1024)}KB`;
  return `${bytes}B`;
}

function StorageCylinder({ percent }: { percent: number }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative mx-auto mt-3 h-[94px] w-[96px]" aria-hidden="true">
      <div className="absolute inset-x-3 bottom-0 h-[74px] overflow-hidden rounded-b-[24px] border-x border-b border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-inner">
        <div
          className="absolute inset-x-0 bottom-0 rounded-b-[28px] bg-[var(--admin-theme-surface)]/20"
          style={{ height: `${Math.max(6, safePercent)}%` }}
        />
      </div>
      <div className="absolute inset-x-3 top-0 h-8 rounded-[50%] border border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] shadow-sm" />
      <div
        className="absolute inset-x-3 rounded-[50%] border border-[var(--admin-theme-surface)] bg-[var(--admin-theme-surface)]/20"
        style={{ bottom: `${Math.max(0, Math.min(66, safePercent * 0.66))}px`, height: 32 }}
      />
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <span className="rounded-full bg-[var(--pbp-surface)]/90 px-2.5 py-1 text-sm font-bold text-[var(--pbp-text-primary)] shadow-sm">
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
  const remainingLabel = hasPlanLimit ? formatBytes(remainingBytes) : t("filesSummary.planCapacityPending", "요금제 확인 중");
  const planName = hasPlanLimit ? t("filesSummary.currentPlan", "현재 요금제") : t("filesSummary.pendingPlan", "확인 중");
  const isDanger = hasPlanLimit && usageSummary.statusTone === "danger";
  const isCaution = hasPlanLimit && usageSummary.statusTone === "caution";

  return (
    <div className={`${ADMIN_STORAGE_CARD_MUTED_CLASS} flex h-full min-h-[190px] flex-col px-4 py-4 md:min-h-[210px] md:px-6 md:py-5`}>
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
    <div className={`${ADMIN_STORAGE_CARD_CLASS} flex h-full min-h-[190px] flex-col px-4 py-4 md:min-h-[210px] md:px-6 md:py-5`}>
      <div>
        <p className={ADMIN_STORAGE_LABEL_CLASS}>
          {t("filesSummary.fileOperationsLabel", "파일 운영")}
        </p>
        <h3 className={`${ADMIN_STORAGE_VALUE_CLASS} mt-1 text-sm`}>{t("filesSummary.fileOperationsTitle", "파일 운영 요약")}</h3>
      </div>
      <div className="mt-4 grid flex-1 content-center gap-2.5">
        {items.map((item) => (
          <div
            key={item.label}
            className={`${ADMIN_STORAGE_SUBTLE_BOX_CLASS} flex items-center justify-between gap-3 px-4 py-3`}
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
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={`${ADMIN_STORAGE_CARD_CLASS} flex h-full min-h-[190px] flex-col px-4 py-4 md:min-h-[210px] md:px-6 md:py-5`}>
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
      <div className="mt-4 flex min-h-0 flex-1 flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
        <div className="relative h-[112px] w-[112px] shrink-0">
          <svg
            viewBox="0 0 112 112"
            className="h-[112px] w-[112px] -rotate-90"
            aria-hidden="true"
          >
            <circle
              cx="56"
              cy="56"
              r={radius}
              fill="none"
              stroke="var(--pbp-border)"
              strokeWidth="12"
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
                      cx="56"
                      cy="56"
                      r={radius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="butt"
                      className={
                        index === 0
                          ? "text-[var(--admin-theme-surface)]"
                          : index === 1
                            ? "text-[var(--pbp-text-muted)]"
                            : index === 2
                              ? "text-[var(--pbp-border-strong)]"
                              : "text-[var(--pbp-border)]"
                      }
                    />
                  );
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`${ADMIN_STORAGE_VALUE_CLASS} text-lg`}>{total}</span>
            <span className={`${ADMIN_STORAGE_SUBTLE_TEXT_CLASS} text-[10px] font-semibold`}>{t("filesSummary.totalLabel", "전체")}</span>
          </div>
        </div>
        <div className="min-w-0 flex-[0.85] space-y-2">
          {normalizedItems.map((item, index) => (
            <div key={item.label} className="min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={`${ADMIN_STORAGE_MUTED_TEXT_CLASS} flex min-w-0 items-center gap-2 font-semibold`}>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${index === 0 ? "bg-[var(--admin-theme-surface)]" : index === 1 ? "bg-[var(--pbp-text-muted)]" : index === 2 ? "bg-[var(--pbp-border-strong)]" : "bg-[var(--pbp-border)]"}`}
                  />
                  <span className="truncate" title={item.label}>{item.label}</span>
                </span>
                <span className={`${ADMIN_STORAGE_VALUE_CLASS} shrink-0 font-bold`}>
                  {formatCountWithUnit(item.value, t)} · {item.percent}%
                </span>
              </div>
              <div className="mt-1 h-1.5 max-w-[360px] overflow-hidden rounded-full bg-[var(--pbp-surface-muted)]">
                <div
                  className={index === 0 ? "h-full rounded-full bg-[var(--admin-theme-surface)]" : index === 1 ? "h-full rounded-full bg-[var(--pbp-text-muted)]" : "h-full rounded-full bg-[var(--pbp-border-strong)]"}
                  style={{ width: `${Math.max(2, item.percent)}%` }}
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
  const attachmentCard = usageCards[1];
  const trashCard = usageCards[2];
  const purgeRequestCard = usageCards[3];
  const rawAttachmentCount = attachmentCard?.value ?? "0개";
  const rawTrashCount = trashCard?.value ?? "0개";
  const rawPurgeRequestCount = purgeRequestCard?.value ?? "0개";
  const isTrashEmpty = rawTrashCount.trim().startsWith("0");
  const isPurgeRequestEmpty = rawPurgeRequestCount.trim().startsWith("0");
  const attachmentCount = translateStorageValue(
    rawAttachmentCount,
    t,
  );
  const attachmentSizeLabel = translateStorageDescription(attachmentCard?.description, t, "filesSummary.zeroActiveSize", "0MB 사용");
  const trashCount = translateStorageValue(
    rawTrashCount,
    t,
  );
  const trashSizeLabel = translateStorageDescription(trashCard?.description, t, "filesSummary.zeroTrashSize", "0MB 보관");
  const purgeRequestCount = translateStorageValue(
    rawPurgeRequestCount,
    t,
  );
  const purgeRequestSizeLabel = translateStorageDescription(purgeRequestCard?.description, t, "filesSummary.zeroPurgeRequestSize", "0MB 처리 대기");
  const statusLabel = translateStorageStatus(
    usageSummary.statusTone,
    usageSummary.statusLabel,
    t,
  );

  const statusItems: FileStatusItem[] = [
    {
      label: t("filesSummary.activeFiles", "사용중 파일"),
      value: attachmentCount,
      description: attachmentSizeLabel,
    },
    {
      label: t("filesSummary.trashFiles", "휴지통 파일"),
      value: trashCount,
      description: isTrashEmpty ? t("filesSummary.zeroTrashSize", "0MB 보관") : trashSizeLabel,
      tone: isTrashEmpty ? "neutral" : "caution",
    },
    {
      label: t("filesSummary.purgeRequestedFiles", "삭제 요청"),
      value: purgeRequestCount,
      description: isPurgeRequestEmpty ? t("filesSummary.zeroPurgeRequestSize", "0MB 처리 대기") : purgeRequestSizeLabel,
      tone: isPurgeRequestEmpty ? "neutral" : "danger",
    },
  ];

  return (
    <section className="grid shrink-0 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-[minmax(250px,0.82fr)_minmax(280px,0.92fr)_minmax(360px,1.18fr)]">
      <PlanUsageCard usageSummary={usageSummary} statusLabel={statusLabel} />
      <FileOperationsCard items={statusItems} />
      <DonutChart items={fileTypeDistribution} />
    </section>
  );
}

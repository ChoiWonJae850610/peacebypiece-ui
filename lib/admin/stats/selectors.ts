import type { DbQueryResultRow } from "@/lib/db/client";
import type { AdminFileUsagePoint, AdminStatChartPoint, AdminSummaryCard } from "@/lib/admin/adminDashboard.presentation";
import type { AdminStatsMetric, AdminStatsPeriodKey, AdminStatsPeriodRange, AdminStatsRatioPoint } from "@/lib/admin/stats/types";
import {
  ADMIN_ATTACHMENT_COUNT_LIMIT,
  ADMIN_FILE_LIMIT_BYTES,
  ADMIN_PARTNER_DISTRIBUTION_BUCKETS,
  ADMIN_TRASH_COUNT_LIMIT,
  ADMIN_WORKORDER_FLOW_BUCKETS,
} from "@/lib/constants/workspaceStats";
import { getI18n } from "@/lib/i18n";
import { formatPbpBinaryBytes, formatPbpInteger } from "@/lib/utils/formatters";

const adminStatsText = getI18n().admin.statsUi;

export type AdminCountRow = DbQueryResultRow & { count_value: string | number | null };
export type AdminStatusCountRow = DbQueryResultRow & { status: string | null; count_value: string | number | null };
export type AdminPartnerTypeCountRow = DbQueryResultRow & { item_type: string | null; count_value: string | number | null };
export type AdminFileUsageRow = DbQueryResultRow & { total_size_bytes: string | number | null; active_count: string | number | null; trash_count: string | number | null };
export type AdminRoundCountRow = DbQueryResultRow & { round_label: string | null; count_value: string | number | null };
export type AdminCategoryCountRow = DbQueryResultRow & { category_label: string | null; count_value: string | number | null };
export type AdminFactoryProductionCountRow = DbQueryResultRow & { factory_label: string | null; count_value: string | number | null };

export function toAdminStatNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatAdminStatInteger(value: number): string {
  return formatPbpInteger(value);
}

export function formatAdminBytes(bytes: number): string {
  return formatPbpBinaryBytes(bytes, {
    zeroLabel: "0B",
    gbFractionDigits: 1,
    mbFractionDigits: 0,
    kbFractionDigits: 0,
  });
}

export function readAdminCount(row: AdminCountRow | undefined): number {
  return toAdminStatNumber(row?.count_value);
}

export function selectAdminStatusCount(rows: AdminStatusCountRow[], statuses: readonly string[]): number {
  return rows.filter((row) => statuses.includes(row.status ?? "")).reduce((sum, row) => sum + toAdminStatNumber(row.count_value), 0);
}

export function selectAdminPartnerCount(rows: AdminPartnerTypeCountRow[], itemTypes: readonly string[]): number {
  return rows.filter((row) => itemTypes.includes(row.item_type ?? "")).reduce((sum, row) => sum + toAdminStatNumber(row.count_value), 0);
}

export function buildAdminWorkorderFlow(rows: AdminStatusCountRow[]): AdminStatChartPoint[] {
  return ADMIN_WORKORDER_FLOW_BUCKETS.map((bucket) => ({ label: adminStatsText.flowBuckets[bucket.labelKey], value: selectAdminStatusCount(rows, bucket.statuses) }));
}

export function buildAdminPartnerDistribution(rows: AdminPartnerTypeCountRow[]): AdminStatChartPoint[] {
  return ADMIN_PARTNER_DISTRIBUTION_BUCKETS.map((bucket) => ({ label: adminStatsText.partnerBuckets[bucket.labelKey], value: selectAdminPartnerCount(rows, bucket.itemTypes) }));
}

export function buildAdminFileUsagePoints(row: AdminFileUsageRow | undefined): { points: AdminFileUsagePoint[]; fileUsageLabel: string; activeFileCount: number; trashFileCount: number } {
  const totalSizeBytes = toAdminStatNumber(row?.total_size_bytes);
  const activeFileCount = toAdminStatNumber(row?.active_count);
  const trashFileCount = toAdminStatNumber(row?.trash_count);
  const storageQuotaLabel = formatAdminBytes(ADMIN_FILE_LIMIT_BYTES);
  const fileUsageLabel = `${formatAdminBytes(totalSizeBytes)} / ${storageQuotaLabel}`;

  return {
    fileUsageLabel,
    activeFileCount,
    trashFileCount,
    points: [
      { label: adminStatsText.fileUsage.total, value: Math.round(totalSizeBytes / (1024 * 1024)), limit: Math.round(ADMIN_FILE_LIMIT_BYTES / (1024 * 1024)), valueLabel: fileUsageLabel },
      { label: adminStatsText.fileUsage.active, value: activeFileCount, limit: ADMIN_ATTACHMENT_COUNT_LIMIT, valueLabel: `${formatAdminStatInteger(activeFileCount)}${adminStatsText.countSuffix}` },
      { label: adminStatsText.fileUsage.trash, value: trashFileCount, limit: ADMIN_TRASH_COUNT_LIMIT, valueLabel: `${formatAdminStatInteger(trashFileCount)}${adminStatsText.countSuffix}` },
    ],
  };
}

export function buildAdminSummaryCards(payload: { totalWorkorders: number; partnerCount: number; fileUsageLabel: string; completedInPeriod: number }): AdminSummaryCard[] {
  return [
    { ...adminStatsText.summaries.totalWorkorders, value: formatAdminStatInteger(payload.totalWorkorders), href: null, accent: "bg-blue-50 text-blue-700" },
    { ...adminStatsText.summaries.partnerCount, value: formatAdminStatInteger(payload.partnerCount), href: null, accent: "bg-emerald-50 text-emerald-700" },
    { ...adminStatsText.summaries.fileUsage, value: payload.fileUsageLabel, href: null, accent: "bg-violet-50 text-violet-700" },
    { ...adminStatsText.summaries.completedInPeriod, value: formatAdminStatInteger(payload.completedInPeriod), href: null, accent: "bg-stone-100 text-stone-700" },
  ];
}

export function buildAdminKeyMetrics(payload: { reviewWaiting: number; inspectionWaiting: number; inboundDelayed: number; defectCount: number }): AdminStatsMetric[] {
  return [
    { key: "reviewWaiting", label: adminStatsText.metrics.reviewWaiting.label, value: payload.reviewWaiting, description: adminStatsText.metrics.reviewWaiting.description },
    { key: "inspectionWaiting", label: adminStatsText.metrics.inspectionWaiting.label, value: payload.inspectionWaiting, description: adminStatsText.metrics.inspectionWaiting.description },
    { key: "inboundDelayed", label: adminStatsText.metrics.inboundDelayed.label, value: payload.inboundDelayed, description: adminStatsText.metrics.inboundDelayed.description },
    { key: "defectCount", label: adminStatsText.metrics.defectCount.label, value: payload.defectCount, description: adminStatsText.metrics.defectCount.description },
  ];
}

export function normalizeAdminStatsPeriod(value: string | string[] | undefined): AdminStatsPeriodKey {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (rawValue === "7d" || rawValue === "custom") return rawValue;
  return "30d";
}

export function isAdminDateInputValue(value: string | string[] | undefined): value is string {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return typeof rawValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawValue);
}

function formatAdminDateLabel(value: string): string {
  return value.replace(/-/g, ".");
}

function toAdminLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentAdminDateInputValue(): string {
  return toAdminLocalDateInputValue(new Date());
}

function getRelativeDateInputValue(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return toAdminLocalDateInputValue(date);
}

export function buildAdminPeriodRange(selectedPeriod: AdminStatsPeriodKey, startDateValue?: string | string[], endDateValue?: string | string[]): AdminStatsPeriodRange {
  const endDate = isAdminDateInputValue(endDateValue) ? endDateValue : getCurrentAdminDateInputValue();
  const startDate = isAdminDateInputValue(startDateValue) ? startDateValue : selectedPeriod === "7d" ? getRelativeDateInputValue(6) : getRelativeDateInputValue(29);

  if (selectedPeriod === "custom" && isAdminDateInputValue(startDateValue) && isAdminDateInputValue(endDateValue) && startDate <= endDate) {
    return {
      startDate,
      endDate,
      label: `${formatAdminDateLabel(startDate)} ~ ${formatAdminDateLabel(endDate)}`,
      isCustom: true,
    };
  }

  if (selectedPeriod === "7d") {
    return {
      startDate: getRelativeDateInputValue(6),
      endDate,
      label: adminStatsText.periods.sevenDays,
      isCustom: false,
    };
  }

  return {
    startDate: getRelativeDateInputValue(29),
    endDate,
    label: adminStatsText.periods.thirtyDays,
    isCustom: false,
  };
}

export function buildAdminPeriodOptions(selectedPeriod: AdminStatsPeriodKey, selectedRange?: AdminStatsPeriodRange) {
  const customHref = selectedRange?.isCustom
    ? `/workspace/stats?period=custom&startDate=${selectedRange.startDate}&endDate=${selectedRange.endDate}`
    : "/workspace/stats?period=custom";
  return [
    { key: "7d" as const, label: adminStatsText.periods.sevenDays, href: "/workspace/stats?period=7d", active: selectedPeriod === "7d" },
    { key: "30d" as const, label: adminStatsText.periods.thirtyDays, href: "/workspace/stats?period=30d", active: selectedPeriod === "30d" },
    { key: "custom" as const, label: selectedRange?.isCustom ? selectedRange.label : adminStatsText.periods.custom, href: customHref, active: selectedPeriod === "custom" },
  ];
}

export function buildAdminRoundDistribution(rows: AdminRoundCountRow[]): AdminStatsRatioPoint[] {
  const fallback = [adminStatsText.productionRounds.first, adminStatsText.productionRounds.second, adminStatsText.productionRounds.thirdOrMore];
  const normalized = rows.map((row) => ({ label: row.round_label === "1차" ? adminStatsText.productionRounds.first : row.round_label === "2차" ? adminStatsText.productionRounds.second : row.round_label === "3차 이상" ? adminStatsText.productionRounds.thirdOrMore : row.round_label || adminStatsText.unknownLabel, value: toAdminStatNumber(row.count_value) }));
  return normalized.length > 0 ? normalized : fallback.map((label) => ({ label, value: 0 }));
}

export function buildAdminCategoryDistribution(rows: AdminCategoryCountRow[]): AdminStatsRatioPoint[] {
  const normalized = rows.map((row) => ({ label: row.category_label || adminStatsText.unknownLabel, value: toAdminStatNumber(row.count_value) })).filter((item) => item.label !== adminStatsText.unknownLabel || item.value > 0);
  return normalized.length > 0 ? normalized : [{ label: adminStatsText.unknownLabel, value: 0 }];
}


export function buildAdminFactoryProductionDistribution(rows: AdminFactoryProductionCountRow[]): AdminStatsRatioPoint[] {
  const normalized = rows
    .map((row) => ({ label: row.factory_label || adminStatsText.unknownLabel, value: toAdminStatNumber(row.count_value) }))
    .filter((item) => item.label !== adminStatsText.unknownLabel || item.value > 0);
  return normalized.length > 0 ? normalized : [{ label: adminStatsText.unknownLabel, value: 0 }];
}
export function buildAdminAttachmentTrashCards(activeFileCount: number, trashFileCount: number): AdminStatsRatioPoint[] {
  return [
    { label: adminStatsText.fileUsage.active, value: activeFileCount, valueLabel: `${formatAdminStatInteger(activeFileCount)}${adminStatsText.countSuffix}` },
    { label: adminStatsText.fileUsage.trash, value: trashFileCount, valueLabel: `${formatAdminStatInteger(trashFileCount)}${adminStatsText.countSuffix}` },
  ];
}

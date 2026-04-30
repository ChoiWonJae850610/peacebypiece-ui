import type { DbQueryResultRow } from "@/lib/db/client";
import type { AdminFileUsagePoint, AdminStatChartPoint, AdminSummaryCard } from "@/lib/admin/adminDashboard.presentation";
import type { AdminStatsMetric, AdminStatsPeriodKey, AdminStatsRatioPoint } from "@/lib/admin/stats/types";
import {
  ADMIN_ATTACHMENT_COUNT_LIMIT,
  ADMIN_FILE_LIMIT_BYTES,
  ADMIN_PARTNER_DISTRIBUTION_BUCKETS,
  ADMIN_TRASH_COUNT_LIMIT,
  ADMIN_WORKORDER_FLOW_BUCKETS,
} from "@/lib/constants/adminStats";
import { getI18n } from "@/lib/i18n";

const adminStatsText = getI18n().admin.statsUi;

export type AdminCountRow = DbQueryResultRow & { count_value: string | number | null };
export type AdminStatusCountRow = DbQueryResultRow & { status: string | null; count_value: string | number | null };
export type AdminPartnerTypeCountRow = DbQueryResultRow & { item_type: string | null; count_value: string | number | null };
export type AdminFileUsageRow = DbQueryResultRow & { total_size_bytes: string | number | null; active_count: string | number | null; trash_count: string | number | null };
export type AdminRoundCountRow = DbQueryResultRow & { round_label: string | null; count_value: string | number | null };
export type AdminCategoryCountRow = DbQueryResultRow & { category_label: string | null; count_value: string | number | null };

export function toAdminStatNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatAdminStatInteger(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.max(0, Math.round(value)));
}

export function formatAdminBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0B";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${Math.round(bytes)}B`;
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
  const fileUsageLabel = `${formatAdminBytes(totalSizeBytes)} / ${adminStatsText.fileUsage.quotaLabel}`;

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
  if (rawValue === "7d" || rawValue === "15d" || rawValue === "30d" || rawValue === "monthly") return rawValue;
  return "30d";
}

export function buildAdminPeriodOptions(selectedPeriod: AdminStatsPeriodKey) {
  return [
    { key: "7d" as const, label: adminStatsText.periods.sevenDays, href: "/admin/dashboard?period=7d", active: selectedPeriod === "7d" },
    { key: "15d" as const, label: adminStatsText.periods.fifteenDays, href: "/admin/dashboard?period=15d", active: selectedPeriod === "15d" },
    { key: "30d" as const, label: adminStatsText.periods.thirtyDays, href: "/admin/dashboard?period=30d", active: selectedPeriod === "30d" },
    { key: "monthly" as const, label: adminStatsText.periods.monthly, href: "/admin/dashboard?period=monthly", active: selectedPeriod === "monthly" },
  ];
}

export function buildAdminRoundDistribution(rows: AdminRoundCountRow[]): AdminStatsRatioPoint[] {
  const fallback = ["1차", "2차", "3차"];
  const normalized = rows.map((row) => ({ label: row.round_label || adminStatsText.unknownLabel, value: toAdminStatNumber(row.count_value) }));
  return normalized.length > 0 ? normalized : fallback.map((label) => ({ label, value: 0 }));
}

export function buildAdminCategoryDistribution(rows: AdminCategoryCountRow[]): AdminStatsRatioPoint[] {
  const normalized = rows.map((row) => ({ label: row.category_label || adminStatsText.unknownLabel, value: toAdminStatNumber(row.count_value) })).filter((item) => item.label !== adminStatsText.unknownLabel || item.value > 0);
  return normalized.length > 0 ? normalized : [{ label: adminStatsText.unknownLabel, value: 0 }];
}

export function buildAdminAttachmentTrashCards(activeFileCount: number, trashFileCount: number): AdminStatsRatioPoint[] {
  return [
    { label: adminStatsText.fileUsage.active, value: activeFileCount, valueLabel: `${formatAdminStatInteger(activeFileCount)}${adminStatsText.countSuffix}` },
    { label: adminStatsText.fileUsage.trash, value: trashFileCount, valueLabel: `${formatAdminStatInteger(trashFileCount)}${adminStatsText.countSuffix}` },
  ];
}

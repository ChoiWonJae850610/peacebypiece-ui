import type { DbQueryResultRow } from "@/lib/db/client";
import type { AdminFileUsagePoint, AdminStatChartPoint, AdminSummaryCard } from "@/lib/admin/adminDashboard.presentation";
import {
  ADMIN_ATTACHMENT_COUNT_LIMIT,
  ADMIN_FILE_LIMIT_BYTES,
  ADMIN_FILE_USAGE_LABELS,
  ADMIN_PARTNER_DISTRIBUTION_BUCKETS,
  ADMIN_STAT_SUMMARY_TEXT,
  ADMIN_TRASH_COUNT_LIMIT,
  ADMIN_WORKORDER_FLOW_BUCKETS,
} from "@/lib/constants/adminStats";

export type AdminCountRow = DbQueryResultRow & {
  count_value: string | number | null;
};

export type AdminStatusCountRow = DbQueryResultRow & {
  status: string | null;
  count_value: string | number | null;
};

export type AdminPartnerTypeCountRow = DbQueryResultRow & {
  item_type: string | null;
  count_value: string | number | null;
};

export type AdminFileUsageRow = DbQueryResultRow & {
  total_size_bytes: string | number | null;
  active_count: string | number | null;
  trash_count: string | number | null;
};

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
  return rows
    .filter((row) => statuses.includes(row.status ?? ""))
    .reduce((sum, row) => sum + toAdminStatNumber(row.count_value), 0);
}

export function selectAdminPartnerCount(rows: AdminPartnerTypeCountRow[], itemTypes: readonly string[]): number {
  return rows
    .filter((row) => itemTypes.includes(row.item_type ?? ""))
    .reduce((sum, row) => sum + toAdminStatNumber(row.count_value), 0);
}

export function buildAdminWorkorderFlow(rows: AdminStatusCountRow[]): AdminStatChartPoint[] {
  return ADMIN_WORKORDER_FLOW_BUCKETS.map((bucket) => ({
    label: bucket.label,
    value: selectAdminStatusCount(rows, bucket.statuses),
  }));
}

export function buildAdminPartnerDistribution(rows: AdminPartnerTypeCountRow[]): AdminStatChartPoint[] {
  return ADMIN_PARTNER_DISTRIBUTION_BUCKETS.map((bucket) => ({
    label: bucket.label,
    value: selectAdminPartnerCount(rows, bucket.itemTypes),
  }));
}

export function buildAdminFileUsagePoints(row: AdminFileUsageRow | undefined): {
  points: AdminFileUsagePoint[];
  fileUsageLabel: string;
} {
  const totalSizeBytes = toAdminStatNumber(row?.total_size_bytes);
  const activeFileCount = toAdminStatNumber(row?.active_count);
  const trashFileCount = toAdminStatNumber(row?.trash_count);
  const fileUsageLabel = `${formatAdminBytes(totalSizeBytes)} / ${ADMIN_FILE_USAGE_LABELS.quotaLabel}`;

  return {
    fileUsageLabel,
    points: [
      { label: ADMIN_FILE_USAGE_LABELS.total, value: Math.round(totalSizeBytes / (1024 * 1024)), limit: Math.round(ADMIN_FILE_LIMIT_BYTES / (1024 * 1024)), valueLabel: fileUsageLabel },
      { label: ADMIN_FILE_USAGE_LABELS.active, value: activeFileCount, limit: ADMIN_ATTACHMENT_COUNT_LIMIT, valueLabel: `${formatAdminStatInteger(activeFileCount)}개` },
      { label: ADMIN_FILE_USAGE_LABELS.trash, value: trashFileCount, limit: ADMIN_TRASH_COUNT_LIMIT, valueLabel: `${formatAdminStatInteger(trashFileCount)}개` },
    ],
  };
}

export function buildAdminSummaryCards(payload: {
  totalWorkorders: number;
  partnerCount: number;
  fileUsageLabel: string;
  completedThisMonth: number;
}): AdminSummaryCard[] {
  return [
    { ...ADMIN_STAT_SUMMARY_TEXT.totalWorkorders, value: formatAdminStatInteger(payload.totalWorkorders) },
    { ...ADMIN_STAT_SUMMARY_TEXT.partnerCount, value: formatAdminStatInteger(payload.partnerCount) },
    { ...ADMIN_STAT_SUMMARY_TEXT.fileUsage, value: payload.fileUsageLabel },
    { ...ADMIN_STAT_SUMMARY_TEXT.completedThisMonth, value: formatAdminStatInteger(payload.completedThisMonth) },
  ];
}

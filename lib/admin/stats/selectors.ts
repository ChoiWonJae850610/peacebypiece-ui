import type { DbQueryResultRow } from "@/lib/db/client";
import type { AdminFileUsagePoint, AdminStatChartPoint, AdminSummaryCard } from "@/lib/admin/adminDashboard.presentation";

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

export const ADMIN_FILE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
export const ADMIN_ATTACHMENT_COUNT_LIMIT = 20;
export const ADMIN_TRASH_COUNT_LIMIT = 20;

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
  return [
    { label: "작성", value: selectAdminStatusCount(rows, ["draft", "rejected"]) },
    { label: "검토", value: selectAdminStatusCount(rows, ["review_requested"]) },
    { label: "발주", value: selectAdminStatusCount(rows, ["review_completed"]) },
    { label: "입고", value: selectAdminStatusCount(rows, ["inspection"]) },
    { label: "완료", value: selectAdminStatusCount(rows, ["completed"]) },
  ];
}

export function buildAdminPartnerDistribution(rows: AdminPartnerTypeCountRow[]): AdminStatChartPoint[] {
  return [
    { label: "공장", value: selectAdminPartnerCount(rows, ["factory"]) },
    { label: "원단", value: selectAdminPartnerCount(rows, ["fabric"]) },
    { label: "부자재", value: selectAdminPartnerCount(rows, ["subsidiary"]) },
    { label: "외주", value: selectAdminPartnerCount(rows, ["outsourcing"]) },
  ];
}

export function buildAdminFileUsagePoints(row: AdminFileUsageRow | undefined): {
  points: AdminFileUsagePoint[];
  fileUsageLabel: string;
} {
  const totalSizeBytes = toAdminStatNumber(row?.total_size_bytes);
  const activeFileCount = toAdminStatNumber(row?.active_count);
  const trashFileCount = toAdminStatNumber(row?.trash_count);
  const fileUsageLabel = `${formatAdminBytes(totalSizeBytes)} / 5.0GB`;

  return {
    fileUsageLabel,
    points: [
      { label: "전체 사용량", value: Math.round(totalSizeBytes / (1024 * 1024)), limit: Math.round(ADMIN_FILE_LIMIT_BYTES / (1024 * 1024)), valueLabel: fileUsageLabel },
      { label: "첨부파일", value: activeFileCount, limit: ADMIN_ATTACHMENT_COUNT_LIMIT, valueLabel: `${formatAdminStatInteger(activeFileCount)}개` },
      { label: "휴지통", value: trashFileCount, limit: ADMIN_TRASH_COUNT_LIMIT, valueLabel: `${formatAdminStatInteger(trashFileCount)}개` },
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
    { label: "전체 작지", value: formatAdminStatInteger(payload.totalWorkorders), href: "/worker", description: "DB 기준 전체 작업 수", accent: "bg-blue-50 text-blue-700" },
    { label: "거래처 수", value: formatAdminStatInteger(payload.partnerCount), href: "/admin/partners", description: "활성 거래처 수", accent: "bg-emerald-50 text-emerald-700" },
    { label: "파일 사용량", value: payload.fileUsageLabel, href: "/admin/files", description: "현재 첨부파일 사용량", accent: "bg-violet-50 text-violet-700" },
    { label: "완료 작지", value: formatAdminStatInteger(payload.completedThisMonth), href: "/worker", description: "이번달 완료 처리", accent: "bg-stone-100 text-stone-700" },
  ];
}

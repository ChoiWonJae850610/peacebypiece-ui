import "server-only";

import {
  ADMIN_STAT_FILE_USAGE_POINTS,
  ADMIN_STAT_PARTNER_DISTRIBUTION,
  ADMIN_STAT_SUMMARIES,
  ADMIN_STAT_WORKORDER_FLOW,
  type AdminFileUsagePoint,
  type AdminStatChartPoint,
  type AdminSummaryCard,
} from "@/lib/admin/adminDashboard.presentation";
import { isDatabaseConfigured, queryDb, type DbQueryResultRow } from "@/lib/db/client";

export type AdminStatsSnapshot = {
  summaries: AdminSummaryCard[];
  workorderFlow: AdminStatChartPoint[];
  partnerDistribution: AdminStatChartPoint[];
  fileUsagePoints: AdminFileUsagePoint[];
  sourceLabel: "DB" | "mock";
};

type CountRow = DbQueryResultRow & {
  count_value: string | number | null;
};

type StatusCountRow = DbQueryResultRow & {
  status: string | null;
  count_value: string | number | null;
};

type PartnerTypeCountRow = DbQueryResultRow & {
  item_type: string | null;
  count_value: string | number | null;
};

type FileUsageRow = DbQueryResultRow & {
  total_size_bytes: string | number | null;
  active_count: string | number | null;
  trash_count: string | number | null;
};

const FILE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;
const ATTACHMENT_COUNT_LIMIT = 20;
const TRASH_COUNT_LIMIT = 20;

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.max(0, Math.round(value)));
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0B";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${Math.round(bytes)}B`;
}

function readCount(row: CountRow | undefined): number {
  return toNumber(row?.count_value);
}

function getStatusCount(rows: StatusCountRow[], statuses: readonly string[]): number {
  return rows
    .filter((row) => statuses.includes(row.status ?? ""))
    .reduce((sum, row) => sum + toNumber(row.count_value), 0);
}

function getPartnerCount(rows: PartnerTypeCountRow[], itemTypes: readonly string[]): number {
  return rows
    .filter((row) => itemTypes.includes(row.item_type ?? ""))
    .reduce((sum, row) => sum + toNumber(row.count_value), 0);
}

function buildFallbackStats(): AdminStatsSnapshot {
  return {
    summaries: ADMIN_STAT_SUMMARIES,
    workorderFlow: ADMIN_STAT_WORKORDER_FLOW,
    partnerDistribution: ADMIN_STAT_PARTNER_DISTRIBUTION,
    fileUsagePoints: ADMIN_STAT_FILE_USAGE_POINTS,
    sourceLabel: "mock",
  };
}

export async function getAdminStatsSnapshot(): Promise<AdminStatsSnapshot> {
  if (!isDatabaseConfigured()) return buildFallbackStats();

  try {
    const [workordersResult, completedResult, partnersResult, partnerTypesResult, fileUsageResult] = await Promise.all([
      queryDb<StatusCountRow>(
        `SELECT COALESCE(status, 'draft') AS status,
                COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE deleted_at IS NULL
            AND COALESCE(is_active, true) = true
          GROUP BY COALESCE(status, 'draft')`,
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM spec_sheets
          WHERE deleted_at IS NULL
            AND COALESCE(is_active, true) = true
            AND status = 'completed'
            AND updated_at >= date_trunc('month', now())`,
      ),
      queryDb<CountRow>(
        `SELECT COUNT(*)::text AS count_value
           FROM partners
          WHERE COALESCE(is_active, true) = true`,
      ),
      queryDb<PartnerTypeCountRow>(
        `SELECT item_type,
                COUNT(DISTINCT partner_id)::text AS count_value
           FROM partner_items
          WHERE COALESCE(is_active, true) = true
          GROUP BY item_type`,
      ),
      queryDb<FileUsageRow>(
        `SELECT COALESCE(SUM(COALESCE(size_bytes, 0)), 0)::text AS total_size_bytes,
                COUNT(*) FILTER (WHERE deleted_at IS NULL AND COALESCE(is_active, true) = true)::text AS active_count,
                COUNT(*) FILTER (WHERE deleted_at IS NOT NULL OR COALESCE(is_active, true) = false)::text AS trash_count
           FROM attachments`,
      ),
    ]);

    const statusRows = workordersResult.rows;
    const totalWorkorders = statusRows.reduce((sum, row) => sum + toNumber(row.count_value), 0);
    const draftCount = getStatusCount(statusRows, ["draft", "rejected"]);
    const reviewCount = getStatusCount(statusRows, ["review_requested"]);
    const reviewCompletedCount = getStatusCount(statusRows, ["review_completed"]);
    const inspectionCount = getStatusCount(statusRows, ["inspection"]);
    const completedCount = getStatusCount(statusRows, ["completed"]);
    const completedThisMonth = readCount(completedResult.rows[0]);
    const partnerCount = readCount(partnersResult.rows[0]);

    const fileUsage = fileUsageResult.rows[0];
    const totalSizeBytes = toNumber(fileUsage?.total_size_bytes);
    const activeFileCount = toNumber(fileUsage?.active_count);
    const trashFileCount = toNumber(fileUsage?.trash_count);
    const fileUsageLabel = `${formatBytes(totalSizeBytes)} / 5.0GB`;

    const workorderFlow: AdminStatChartPoint[] = [
      { label: "작성", value: draftCount },
      { label: "검토", value: reviewCount },
      { label: "발주", value: reviewCompletedCount },
      { label: "입고", value: inspectionCount },
      { label: "완료", value: completedCount },
    ];

    const partnerRows = partnerTypesResult.rows;
    const partnerDistribution: AdminStatChartPoint[] = [
      { label: "공장", value: getPartnerCount(partnerRows, ["factory"]) },
      { label: "원단", value: getPartnerCount(partnerRows, ["fabric"]) },
      { label: "부자재", value: getPartnerCount(partnerRows, ["subsidiary"]) },
      { label: "외주", value: getPartnerCount(partnerRows, ["outsourcing"]) },
    ];

    const fileUsagePoints: AdminFileUsagePoint[] = [
      { label: "전체 사용량", value: Math.round(totalSizeBytes / (1024 * 1024)), limit: Math.round(FILE_LIMIT_BYTES / (1024 * 1024)), valueLabel: fileUsageLabel },
      { label: "첨부파일", value: activeFileCount, limit: ATTACHMENT_COUNT_LIMIT, valueLabel: `${formatInteger(activeFileCount)}개` },
      { label: "휴지통", value: trashFileCount, limit: TRASH_COUNT_LIMIT, valueLabel: `${formatInteger(trashFileCount)}개` },
    ];

    const summaries: AdminSummaryCard[] = [
      { label: "전체 작지", value: formatInteger(totalWorkorders), href: "/worker", description: "DB 기준 전체 작업 수", accent: "bg-blue-50 text-blue-700" },
      { label: "거래처 수", value: formatInteger(partnerCount), href: "/admin/partners", description: "활성 거래처 수", accent: "bg-emerald-50 text-emerald-700" },
      { label: "파일 사용량", value: fileUsageLabel, href: "/admin/files", description: "현재 첨부파일 사용량", accent: "bg-violet-50 text-violet-700" },
      { label: "완료 작지", value: formatInteger(completedThisMonth), href: "/worker", description: "이번달 완료 처리", accent: "bg-stone-100 text-stone-700" },
    ];

    return {
      summaries,
      workorderFlow,
      partnerDistribution,
      fileUsagePoints,
      sourceLabel: "DB",
    };
  } catch (error) {
    console.warn("[admin-stats] failed to load DB stats. Falling back to mock stats.", error);
    return buildFallbackStats();
  }
}

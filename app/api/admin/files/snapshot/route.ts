import { NextResponse } from "next/server";
import { getAdminFileManagementSnapshot } from "@/lib/admin/files/adapter";
import { buildAdminStoragePolicyItems, normalizeAdminFilePolicySettings } from "@/lib/admin/files/presentation";
import { getCompanySettings, getCurrentAdminCompany } from "@/lib/admin/settings/companyRepository";
import { listAdminFileManagementRows } from "@/lib/admin/files/serverActions";
import { queryDb } from "@/lib/db/client";
import type { DbQueryResultRow } from "@/lib/db/client";
import type { AdminFileTrendPeriod, AdminFileTypeDistributionItem, AdminFileUsageCard, AdminRecentUploadTrendPoint, AdminManagedFileItem, AdminStorageUsageSummary } from "@/lib/admin/files/types";
import type { CompanyFilePolicySettings } from "@/lib/admin/settings/companyTypes";

export const runtime = "nodejs";

const BYTES_PER_GB = 1024 ** 3;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0B";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

function buildUsageSummary(activeBytes: number, trashBytes: number, filePolicy: CompanyFilePolicySettings): AdminStorageUsageSummary {
  const safeActiveBytes = Number.isFinite(activeBytes) ? Math.max(0, activeBytes) : 0;
  const safeTrashBytes = Number.isFinite(trashBytes) ? Math.max(0, trashBytes) : 0;
  const storageLimitGb = Number.isFinite(filePolicy.storageLimitGb) ? Math.max(1, filePolicy.storageLimitGb) : 1;
  const warningThresholdPercent = Number.isFinite(filePolicy.warningThresholdPercent) ? Math.min(100, Math.max(1, filePolicy.warningThresholdPercent)) : 80;
  const usedBytes = safeActiveBytes + (filePolicy.includeTrashInUsage ? safeTrashBytes : 0);
  const limitBytes = storageLimitGb * BYTES_PER_GB;
  const usagePercent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const statusTone = usagePercent >= 100 ? "danger" : usagePercent >= warningThresholdPercent ? "caution" : "normal";
  const statusLabel = statusTone === "danger" ? "위험" : statusTone === "caution" ? "주의" : "정상";

  return {
    usedBytes,
    limitBytes,
    usedLabel: formatBytes(usedBytes),
    limitLabel: formatBytes(limitBytes),
    usagePercent,
    statusLabel,
    statusTone,
  };
}

function normalizeTrendPeriod(value: string | null): AdminFileTrendPeriod {
  if (value === "15") return 15;
  if (value === "30") return 30;
  return 7;
}

function buildRecentUploadTrend(uploadedDates: string[], period: AdminFileTrendPeriod): AdminRecentUploadTrendPoint[] {
  const today = new Date();
  const days = Array.from({ length: period }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (period - 1 - index));
    const key = date.toISOString().slice(0, 10);
    const remaining = period - 1 - index;
    return {
      key,
      label: remaining === 0 ? "오늘" : remaining === 1 ? "어제" : `${remaining}일전`,
      value: 0,
    };
  });

  uploadedDates.forEach((uploadedAt) => {
    const target = days.find((day) => day.key === uploadedAt.slice(0, 10));
    if (target) target.value += 1;
  });

  return days.map(({ label, value }) => ({ label, value }));
}

function isWithinTrendPeriod(uploadedAt: string, period: AdminFileTrendPeriod): boolean {
  const uploadedDate = new Date(uploadedAt);
  if (Number.isNaN(uploadedDate.getTime())) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (period - 1));
  return uploadedDate >= start;
}

function normalizeFileTypeLabel(fileType: string, fileName = ""): string {
  const source = `${fileType || ""} ${fileName || ""}`.trim().toLowerCase();
  const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() ?? "" : "";

  if (
    source.includes("image") ||
    source.includes("img") ||
    source.includes("design") ||
    source.includes("디자인") ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "heic", "heif", "ai", "psd"].includes(extension)
  ) {
    return "디자인";
  }

  return "문서";
}

function buildFileTypeDistribution(items: AdminManagedFileItem[], period: AdminFileTrendPeriod): AdminFileTypeDistributionItem[] {
  const filteredItems = items.filter((item) => isWithinTrendPeriod(item.uploadedAt, period));
  const counts = new Map<string, number>([
    ["문서", 0],
    ["디자인", 0],
  ]);

  filteredItems.forEach((item) => {
    const label = normalizeFileTypeLabel(item.fileType, item.fileName);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  const total = Math.max(1, filteredItems.length);
  return Array.from(counts.entries()).map(([label, value]) => ({
    label,
    value,
    percent: Math.round((value / total) * 100),
  }));
}

type PurgeRequestSummaryRow = DbQueryResultRow & {
  file_count: string | number | null;
  size_bytes: string | number | null;
};

function readNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getPurgeRequestSummary(): Promise<{ count: number; bytes: number }> {
  const result = await queryDb<PurgeRequestSummaryRow>(
    `WITH purge_requested_attachments AS (
       SELECT DISTINCT ON (t.attachment_id)
              t.attachment_id,
              COALESCE(t.size_bytes, a.size_bytes, 0) AS size_bytes
         FROM attachment_trash_items t
         LEFT JOIN attachments a ON a.id = t.attachment_id
        WHERE t.purge_status = 'purge_requested'
          AND t.attachment_id IS NOT NULL
          AND t.restored_at IS NULL
          AND t.purged_at IS NULL
        ORDER BY t.attachment_id, COALESCE(t.updated_at, t.deleted_at) DESC
     )
     SELECT COUNT(*)::text AS file_count,
            COALESCE(SUM(size_bytes), 0)::text AS size_bytes
       FROM purge_requested_attachments`,
  );
  const row = result.rows[0];
  return {
    count: readNumber(row?.file_count),
    bytes: readNumber(row?.size_bytes),
  };
}

function buildUsageCards(
  activeCount: number,
  trashCount: number,
  activeBytes: number,
  trashBytes: number,
  purgeRequestCount: number,
  purgeRequestBytes: number,
  filePolicy: CompanyFilePolicySettings,
): AdminFileUsageCard[] {
  const summary = buildUsageSummary(activeBytes, trashBytes, filePolicy);
  return [
    { label: "전체 사용량", value: `${summary.usedLabel} / ${summary.limitLabel}`, description: filePolicy.includeTrashInUsage ? "휴지통 보관 파일 포함" : "사용중 파일만 합산" },
    { label: "첨부파일", value: `${activeCount}개`, description: `${formatBytes(activeBytes)} 사용` },
    { label: "휴지통", value: `${trashCount}개`, description: `${formatBytes(trashBytes)} 보관` },
    { label: "삭제 요청", value: `${purgeRequestCount}개`, description: `${formatBytes(purgeRequestBytes)} 처리 대기` },
  ];
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const trendPeriod = normalizeTrendPeriod(requestUrl.searchParams.get("period"));
  const fallbackSnapshot = { ...getAdminFileManagementSnapshot(), recentUploadTrendPeriod: trendPeriod };

  try {
    const company = await getCurrentAdminCompany();
    const settings = await getCompanySettings(company.id);
    const policySettings = normalizeAdminFilePolicySettings(settings.filePolicy);
    const rows = await listAdminFileManagementRows(settings.filePolicy.trashRetentionDays);
    const activeBytes = rows.attachments.reduce((total, item) => total + item.fileSizeBytes, 0);
    const trashBytes = rows.trashItems.reduce((total, item) => total + item.fileSizeBytes, 0);
    const purgeRequestSummary = await getPurgeRequestSummary();

    return NextResponse.json({
      ok: true,
      snapshot: {
        ...fallbackSnapshot,
        dataSource: "db",
        dataSourceLabel: "DB 조회",
        workOrders: rows.workOrders,
        attachments: rows.attachments,
        trashItems: rows.trashItems,
        usageSummary: buildUsageSummary(activeBytes, trashBytes, settings.filePolicy),
        usageCards: buildUsageCards(rows.attachments.length, rows.trashItems.length, activeBytes, trashBytes, purgeRequestSummary.count, purgeRequestSummary.bytes, settings.filePolicy),
        storagePolicies: buildAdminStoragePolicyItems(policySettings),
        policySettings,
        recentUploadTrend: buildRecentUploadTrend(rows.attachments.map((item) => item.uploadedAt), trendPeriod),
        recentUploadTrendPeriod: trendPeriod,
        fileTypeDistribution: buildFileTypeDistribution(rows.attachments, trendPeriod),
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_SNAPSHOT_DB_FALLBACK]", { message, error });

    return NextResponse.json({
      ok: false,
      error: "ADMIN_FILE_SNAPSHOT_DB_FALLBACK",
      message,
      snapshot: fallbackSnapshot,
    });
  }
}

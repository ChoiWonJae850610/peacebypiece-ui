import { NextResponse } from "next/server";
import { getAdminFileManagementSnapshot } from "@/lib/admin/adminFiles.adapter";
import { getCompanySettings, getCurrentAdminCompany } from "@/lib/admin/companySettings.repository";
import { listAdminFileManagementRows } from "@/lib/admin/adminFiles.serverActions";
import type { AdminFileUsageCard, AdminStoragePolicyItem, AdminStoragePolicySettings, AdminStorageUsageSummary } from "@/lib/admin/adminFiles.types";
import type { CompanyFilePolicySettings } from "@/lib/admin/companySettings.types";

export const runtime = "nodejs";

const BYTES_PER_GB = 1024 ** 3;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}

function buildPolicySettings(filePolicy: CompanyFilePolicySettings): AdminStoragePolicySettings {
  const purgeAfterDays = [1, 5, 15, 30].includes(filePolicy.trashRetentionDays) ? filePolicy.trashRetentionDays : 15;

  return {
    softDeleteEnabled: filePolicy.softDeleteEnabled,
    includeTrashInUsage: filePolicy.includeTrashInUsage,
    purgeAfterDays: purgeAfterDays as AdminStoragePolicySettings["purgeAfterDays"],
  };
}

function buildStoragePolicyItems(policySettings: AdminStoragePolicySettings): AdminStoragePolicyItem[] {
  return [
    {
      label: "삭제 방식",
      value: policySettings.softDeleteEnabled ? "소프트 삭제" : "즉시 삭제",
      description: policySettings.softDeleteEnabled ? "삭제 시 휴지통으로 이동하고 복구 가능 기간을 둡니다." : "삭제 액션 시 실제 삭제 흐름으로 바로 연결합니다.",
    },
    {
      label: "용량 계산",
      value: policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중 파일만",
      description: policySettings.includeTrashInUsage ? "R2 원본이 실제 삭제되기 전까지 휴지통 파일도 사용량에 포함합니다." : "휴지통 파일은 사용량 합산에서 제외합니다.",
    },
    {
      label: "실제 삭제",
      value: `${policySettings.purgeAfterDays}일 이후`,
      description: "purge_after_at 이후 dryRun 검토 후 실제 삭제 작업을 실행합니다.",
    },
  ];
}

function buildUsageSummary(activeBytes: number, trashBytes: number, filePolicy: CompanyFilePolicySettings): AdminStorageUsageSummary {
  const usedBytes = activeBytes + (filePolicy.includeTrashInUsage ? trashBytes : 0);
  const limitBytes = Math.max(1, filePolicy.storageLimitGb) * BYTES_PER_GB;
  const usagePercent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const statusTone = usagePercent >= filePolicy.warningThresholdPercent ? "warning" : "normal";

  return {
    usedBytes,
    limitBytes,
    usedLabel: formatBytes(usedBytes),
    limitLabel: formatBytes(limitBytes),
    usagePercent,
    statusLabel: statusTone === "warning" ? "주의" : "정상",
    statusTone,
  };
}

function buildUsageCards(activeCount: number, trashCount: number, activeBytes: number, trashBytes: number, filePolicy: CompanyFilePolicySettings): AdminFileUsageCard[] {
  const summary = buildUsageSummary(activeBytes, trashBytes, filePolicy);
  return [
    { label: "전체 사용량", value: `${summary.usedLabel} / ${summary.limitLabel}`, description: filePolicy.includeTrashInUsage ? "휴지통 보관 파일 포함" : "사용중 파일만 합산" },
    { label: "첨부파일", value: `${activeCount}개`, description: `${formatBytes(activeBytes)} 사용` },
    { label: "휴지통", value: `${trashCount}개`, description: `${formatBytes(trashBytes)} 보관` },
    { label: "복구 가능 기간", value: `${filePolicy.trashRetentionDays}일`, description: "company_settings.trash_retention_days 기준" },
  ];
}

export async function GET() {
  const fallbackSnapshot = getAdminFileManagementSnapshot();

  try {
    const [rows, company] = await Promise.all([listAdminFileManagementRows(), getCurrentAdminCompany()]);
    const settings = await getCompanySettings(company.id);
    const policySettings = buildPolicySettings(settings.filePolicy);
    const activeBytes = rows.attachments.reduce((total, item) => total + item.fileSizeBytes, 0);
    const trashBytes = rows.trashItems.reduce((total, item) => total + item.fileSizeBytes, 0);

    return NextResponse.json({
      ok: true,
      snapshot: {
        ...fallbackSnapshot,
        dataSource: "db",
        dataSourceLabel: "DB 조회",
        attachments: rows.attachments,
        trashItems: rows.trashItems,
        usageSummary: buildUsageSummary(activeBytes, trashBytes, settings.filePolicy),
        usageCards: buildUsageCards(rows.attachments.length, rows.trashItems.length, activeBytes, trashBytes, settings.filePolicy),
        storagePolicies: buildStoragePolicyItems(policySettings),
        policySettings,
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

import {
  ADMIN_FILE_TABS,
  ADMIN_STORAGE_POLICY_SETTINGS,
  buildAdminStoragePolicyItems,
} from "@/lib/admin/adminFiles.presentation";
import type { AdminFileManagementSnapshot } from "@/lib/admin/adminFiles.types";

export function getAdminFileManagementSnapshot(): AdminFileManagementSnapshot {
  const usageSummary = {
    usedBytes: 0,
    limitBytes: 0,
    usedLabel: "0B",
    limitLabel: "Checking plan",
    usagePercent: 0,
    statusLabel: "normal" as const,
    statusTone: "normal" as const,
  };

  return {
    companyName: null,
    dataSource: "db",
    dataSourceLabel: "DB 대기",
    usageCards: [
      { label: "totalUsage", value: `${usageSummary.usedLabel} / ${usageSummary.limitLabel}`, description: "Checking plan capacity" },
      { label: "activeFiles", value: "0 items", description: "0MB used" },
      { label: "trashFiles", value: "0 items", description: "0MB stored" },
      { label: "purgeRequestedFiles", value: "0 items", description: "0MB waiting" },
    ],
    usageSummary,
    tabs: ADMIN_FILE_TABS,
    workOrders: [],
    attachments: [],
    trashItems: [],
    storagePolicies: buildAdminStoragePolicyItems(ADMIN_STORAGE_POLICY_SETTINGS),
    policySettings: ADMIN_STORAGE_POLICY_SETTINGS,
    recentUploadTrend: [
      { label: "D-6", value: 0 },
      { label: "D-5", value: 0 },
      { label: "D-4", value: 0 },
      { label: "D-3", value: 0 },
      { label: "D-2", value: 0 },
      { label: "D-1", value: 0 },
      { label: "D-Day", value: 0 },
    ],
    recentUploadTrendPeriod: 7,
    fileTypeDistribution: [
      { label: "Documents", value: 0, percent: 0 },
      { label: "Designs", value: 0, percent: 0 },
    ],
  };
}

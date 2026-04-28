import {
  ADMIN_FILE_TABS,
  ADMIN_FILE_USAGE_SUMMARY,
  ADMIN_STORAGE_POLICY_SETTINGS,
  buildAdminStoragePolicyItems,
} from "@/lib/admin/adminFiles.presentation";
import type { AdminFileManagementSnapshot } from "@/lib/admin/adminFiles.types";

export function getAdminFileManagementSnapshot(): AdminFileManagementSnapshot {
  const usageSummary = {
    ...ADMIN_FILE_USAGE_SUMMARY,
    usedBytes: 0,
    usedLabel: "0B",
    usagePercent: 0,
    statusLabel: "정상" as const,
    statusTone: "normal" as const,
  };

  return {
    dataSource: "db",
    dataSourceLabel: "DB 대기",
    usageCards: [
      { label: "전체 사용량", value: `${usageSummary.usedLabel} / ${usageSummary.limitLabel}`, description: "" },
      { label: "첨부파일", value: "0개", description: "" },
      { label: "휴지통", value: "0개", description: "" },
      { label: "복구 가능 기간", value: `${ADMIN_STORAGE_POLICY_SETTINGS.purgeAfterDays}일`, description: "" },
    ],
    usageSummary,
    tabs: ADMIN_FILE_TABS,
    attachments: [],
    trashItems: [],
    storagePolicies: buildAdminStoragePolicyItems(ADMIN_STORAGE_POLICY_SETTINGS),
    policySettings: ADMIN_STORAGE_POLICY_SETTINGS,
    recentUploadTrend: [
      { label: "6일전", value: 0 },
      { label: "5일전", value: 0 },
      { label: "4일전", value: 0 },
      { label: "3일전", value: 0 },
      { label: "2일전", value: 0 },
      { label: "어제", value: 0 },
      { label: "오늘", value: 0 },
    ],
  };
}

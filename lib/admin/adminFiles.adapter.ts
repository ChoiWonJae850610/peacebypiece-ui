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
    limitLabel: "요금제 확인 중",
    usagePercent: 0,
    statusLabel: "확인 중" as const,
    statusTone: "normal" as const,
  };

  return {
    dataSource: "db",
    dataSourceLabel: "DB 대기",
    usageCards: [
      { label: "전체 사용량", value: `${usageSummary.usedLabel} / ${usageSummary.limitLabel}`, description: "요금제 용량 확인 중" },
      { label: "첨부파일", value: "0개", description: "0MB 사용" },
      { label: "휴지통", value: "0개", description: "0MB 보관" },
      { label: "삭제 요청", value: "0개", description: "0MB 처리 대기" },
    ],
    usageSummary,
    tabs: ADMIN_FILE_TABS,
    workOrders: [],
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
    recentUploadTrendPeriod: 7,
    fileTypeDistribution: [
      { label: "문서", value: 0, percent: 0 },
      { label: "디자인", value: 0, percent: 0 },
    ],
  };
}

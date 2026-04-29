import type {
  AdminFileDataSource,
  AdminFileSortKey,
  AdminFileTabItem,
  AdminFileUsageCard,
  AdminManagedFileItem,
  AdminStoragePolicyItem,
  AdminStoragePolicySettings,
  AdminStorageUsageSummary,
  AdminTrashFileItem,
} from "@/lib/admin/adminFiles.types";

export type { AdminFileTabKey } from "@/lib/admin/adminFiles.types";

export const ADMIN_FILE_USAGE_SUMMARY: AdminStorageUsageSummary = {
  usedBytes: 2147483648,
  limitBytes: 5368709120,
  usedLabel: "2.0GB",
  limitLabel: "5.0GB",
  usagePercent: 40,
  statusLabel: "정상",
  statusTone: "normal",
};

export const ADMIN_FILE_USAGE_CARDS: AdminFileUsageCard[] = [
  { label: "전체 사용량", value: "2.0GB / 5.0GB", description: "휴지통 보관 파일 포함" },
  { label: "첨부파일", value: "3개", description: "작업지시서에 연결된 이미지, PDF, 기타 파일" },
  { label: "휴지통", value: "2개", description: "소프트 삭제 후 보관 중인 파일" },
  { label: "복구 가능 기간", value: "15일", description: "company_settings.trash_retention_days 기준" },
];

export const ADMIN_FILE_TABS: AdminFileTabItem[] = [
  {
    key: "attachments",
    label: "첨부파일 목록",
    description: "작업지시서명, 파일명, 파일 유형, 용량, 등록자를 함께 확인",
  },
  {
    key: "trash",
    label: "휴지통",
    description: "삭제 요청된 파일의 복구 가능 상태 확인",
  },
  {
    key: "storage",
    label: "용량 관리",
    description: "사용량, 보관 정책, 용량 추가 요청 관리",
  },
];

export const ADMIN_FILE_SORT_OPTIONS: { key: AdminFileSortKey; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "size", label: "용량순" },
  { key: "workorder", label: "작업지시서명순" },
];

export const ADMIN_FILE_LIST_PLACEHOLDERS: AdminManagedFileItem[] = [
  {
    id: "sample-attachment-1",
    workorderId: "sample-workorder-1",
    workorderTitle: "샘플 작업지시서 A",
    fileName: "design-reference.png",
    fileType: "이미지",
    fileIcon: "IMG",
    fileSizeBytes: 7340032,
    fileSizeLabel: "7MB",
    uploadedAt: "2026-04-27",
    uploadedBy: "관리자",
    status: "active",
    statusLabel: "사용중",
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    purgeAfterAt: null,
  },
  {
    id: "sample-attachment-2",
    workorderId: "sample-workorder-2",
    workorderTitle: "샘플 작업지시서 B",
    fileName: "production-note.pdf",
    fileType: "PDF",
    fileIcon: "PDF",
    fileSizeBytes: 18874368,
    fileSizeLabel: "18MB",
    uploadedAt: "2026-04-26",
    uploadedBy: "디자이너",
    status: "active",
    statusLabel: "사용중",
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    purgeAfterAt: null,
  },
  {
    id: "sample-attachment-3",
    workorderId: "sample-workorder-3",
    workorderTitle: "샘플 작업지시서 C",
    fileName: "factory-reference.xlsx",
    fileType: "기타",
    fileIcon: "FILE",
    fileSizeBytes: 2097152,
    fileSizeLabel: "2MB",
    uploadedAt: "2026-04-25",
    uploadedBy: "관리자",
    status: "active",
    statusLabel: "사용중",
    deletedAt: null,
    deletedBy: null,
    deleteReason: null,
    purgeAfterAt: null,
  },
];

export const ADMIN_FILE_TRASH_PLACEHOLDERS: AdminTrashFileItem[] = [
  {
    id: "sample-trash-1",
    attachmentId: "sample-attachment-4",
    workorderId: "sample-workorder-1",
    workorderTitle: "샘플 작업지시서 A",
    fileName: "removed-reference.pdf",
    fileIcon: "PDF",
    fileSizeBytes: 5242880,
    fileSizeLabel: "5MB",
    deletedAt: "2026-04-24",
    deletedBy: "관리자",
    purgeAfterAt: "2026-05-24",
    restoreDaysLeft: 27,
    restoreLabel: "D-27",
    deleteReason: "중복 첨부 정리",
    purgeStatus: "pending",
    purgeStatusLabel: "복구 가능",
    isPurgeReady: false,
    lastPurgeError: null,
  },
  {
    id: "sample-trash-2",
    attachmentId: "sample-attachment-5",
    workorderId: "sample-workorder-2",
    workorderTitle: "샘플 작업지시서 B",
    fileName: "old-detail-image.jpg",
    fileIcon: "IMG",
    fileSizeBytes: 9437184,
    fileSizeLabel: "9MB",
    deletedAt: "2026-04-20",
    deletedBy: "관리자",
    purgeAfterAt: "2026-05-20",
    restoreDaysLeft: 23,
    restoreLabel: "D-23",
    deleteReason: "최신 이미지로 교체",
    purgeStatus: "pending",
    purgeStatusLabel: "복구 가능",
    isPurgeReady: false,
    lastPurgeError: null,
  },
];


export const ADMIN_STORAGE_POLICY_SETTINGS: AdminStoragePolicySettings = {
  softDeleteEnabled: true,
  includeTrashInUsage: true,
  purgeAfterDays: 15,
};

export const ADMIN_STORAGE_POLICY_ITEMS: AdminStoragePolicyItem[] = [
  {
    label: "삭제 방식",
    value: "소프트 삭제",
    description: "삭제 시 attachments.deleted_at, deleted_by, delete_reason, purge_after_at 값을 기록",
  },
  {
    label: "용량 계산",
    value: "휴지통 포함",
    description: "R2 원본이 실제 삭제되기 전까지 휴지통 파일도 사용량에 포함",
  },
  {
    label: "실제 삭제",
    value: "15일 이후",
    description: "purge_after_at 이후 dryRun 검토 후 /api/admin/files/trash/purge-worker가 R2 원본과 썸네일 삭제",
  },
];

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeAdminFilePolicySettings(filePolicy: { softDeleteEnabled?: unknown; includeTrashInUsage?: unknown; trashRetentionDays?: unknown }): AdminStoragePolicySettings {
  const parsedDays = Math.trunc(Number(filePolicy.trashRetentionDays));
  const purgeAfterDays = [1, 5, 15, 30].includes(parsedDays) ? parsedDays : 15;

  return {
    softDeleteEnabled: readBoolean(filePolicy.softDeleteEnabled, true),
    includeTrashInUsage: readBoolean(filePolicy.includeTrashInUsage, true),
    purgeAfterDays: purgeAfterDays as AdminStoragePolicySettings["purgeAfterDays"],
  };
}

export function buildAdminStoragePolicyItems(policySettings: AdminStoragePolicySettings): AdminStoragePolicyItem[] {
  return [
    {
      label: "삭제 방식",
      value: policySettings.softDeleteEnabled ? "소프트 삭제" : "즉시 삭제",
      description: policySettings.softDeleteEnabled ? "삭제 시 휴지통으로 이동하고 복구 가능 기간을 둡니다." : "삭제 액션 시 R2 실제 삭제 흐름으로 바로 연결합니다.",
    },
    {
      label: "용량 계산",
      value: policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중 파일만",
      description: policySettings.includeTrashInUsage ? "R2 원본이 실제 삭제되기 전까지 휴지통 파일도 사용량에 포함합니다." : "휴지통 파일은 사용량 합산에서 제외합니다.",
    },
    {
      label: "실제 삭제",
      value: `${policySettings.purgeAfterDays}일 이후`,
      description: "company_settings.trash_retention_days 기준으로 purge 후보를 계산합니다.",
    },
  ];
}

export function sortAdminManagedFiles(items: AdminManagedFileItem[], sortKey: AdminFileSortKey): AdminManagedFileItem[] {
  return [...items].sort((a, b) => {
    if (sortKey === "size") {
      return b.fileSizeBytes - a.fileSizeBytes;
    }
    if (sortKey === "workorder") {
      return a.workorderTitle.localeCompare(b.workorderTitle, "ko");
    }
    return b.uploadedAt.localeCompare(a.uploadedAt);
  });
}

export function selectAdminManagedFilesByIds(items: AdminManagedFileItem[], selectedIds: string[]): AdminManagedFileItem[] {
  if (selectedIds.length === 0) return [];
  const selectedIdSet = new Set(selectedIds);
  return items.filter((item) => selectedIdSet.has(item.id));
}

export function selectAdminTrashItemsByIds(items: AdminTrashFileItem[], selectedIds: string[]): AdminTrashFileItem[] {
  if (selectedIds.length === 0) return [];
  const selectedIdSet = new Set(selectedIds);
  return items.filter((item) => selectedIdSet.has(item.id));
}

export function toggleAdminSelectedId(currentIds: string[], targetId: string): string[] {
  return currentIds.includes(targetId) ? currentIds.filter((id) => id !== targetId) : [...currentIds, targetId];
}

export function buildAdminSelectAllIds<T extends { id: string }>(items: T[], currentIds: string[]): string[] {
  return currentIds.length === items.length ? [] : items.map((item) => item.id);
}

export function getAdminFilePolicySourceLabel(dataSource: AdminFileDataSource): string {
  return dataSource === "db" ? "company_settings DB" : "샘플 정책";
}

export function buildAdminFilePolicyUpdateInput(policySettings: AdminStoragePolicySettings) {
  return {
    filePolicy: {
      softDeleteEnabled: policySettings.softDeleteEnabled,
      includeTrashInUsage: policySettings.includeTrashInUsage,
      trashRetentionDays: policySettings.purgeAfterDays,
    },
  };
}

export function buildAdminStoragePolicyBadges(policySettings: AdminStoragePolicySettings): { label: string; value: string }[] {
  return [
    { label: "삭제 방식", value: policySettings.softDeleteEnabled ? "소프트 삭제" : "즉시 삭제" },
    { label: "용량 계산", value: policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중 파일만" },
    { label: "실제 삭제 기간", value: `${policySettings.purgeAfterDays}일` },
  ];
}

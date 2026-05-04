import type {
  AdminFileDataSource,
  AdminFileSortKey,
  AdminFileTabItem,
  AdminFileUsageCard,
  AdminManagedFileItem,
  AdminStoragePolicyItem,
  AdminStoragePolicySettings,
  AdminStorageUsageSummary,
  AdminStorageWorkOrderItem,
  AdminTrashFileItem,
} from "@/lib/admin/adminFiles.types";
import { COMPANY_FILE_TRASH_RETENTION_DAYS } from "@/lib/admin/settings/companyDefaults";

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
  { label: "보관 기간", value: `${COMPANY_FILE_TRASH_RETENTION_DAYS}일`, description: "전 고객 공통 30일 휴지통 보관 정책" },
];

export const ADMIN_FILE_TABS: AdminFileTabItem[] = [
  {
    key: "workorders",
    label: "작업지시서",
    description: "삭제된 작업지시서와 연결 파일·메모 상태를 읽기 전용으로 확인",
  },
  {
    key: "attachments",
    label: "첨부파일 목록",
    description: "작업지시서명, 파일명, 파일 유형, 용량, 등록자를 함께 확인",
  },
  {
    key: "trash",
    label: "휴지통",
    description: "삭제 요청된 파일의 보관 상태 확인",
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
export const ADMIN_FILE_WORKORDER_PLACEHOLDERS: AdminStorageWorkOrderItem[] = [];

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
    parentWorkOrderDeleted: false,
    canRestore: true,
    restoreDisabledReason: null,
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
    parentWorkOrderDeleted: false,
    canRestore: true,
    restoreDisabledReason: null,
  },
];


export const ADMIN_STORAGE_POLICY_SETTINGS: AdminStoragePolicySettings = {
  softDeleteEnabled: true,
  includeTrashInUsage: true,
  purgeAfterDays: COMPANY_FILE_TRASH_RETENTION_DAYS,
};

export const ADMIN_STORAGE_POLICY_ITEMS: AdminStoragePolicyItem[] = [
  {
    label: "삭제 방식",
    value: "휴지통",
    description: "삭제 시 R2 객체를 즉시 삭제하지 않고 휴지통 상태로 기록",
  },
  {
    label: "용량 계산",
    value: "휴지통 포함",
    description: "R2 원본이 실제 삭제되기 전까지 휴지통 파일도 사용량에 포함",
  },
  {
    label: "보관기간",
    value: `${COMPANY_FILE_TRASH_RETENTION_DAYS}일`,
    description: "전 고객 공통 30일 휴지통 보관 정책",
  },
];

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function normalizeAdminFilePolicySettings(filePolicy: { softDeleteEnabled?: unknown; includeTrashInUsage?: unknown; trashRetentionDays?: unknown }): AdminStoragePolicySettings {
  return {
    softDeleteEnabled: true,
    includeTrashInUsage: readBoolean(filePolicy.includeTrashInUsage, true),
    purgeAfterDays: COMPANY_FILE_TRASH_RETENTION_DAYS,
  };
}

export function buildAdminStoragePolicyItems(policySettings: AdminStoragePolicySettings): AdminStoragePolicyItem[] {
  return [
    {
      label: "삭제 방식",
      value: "휴지통",
      description: "삭제된 파일은 30일 동안 복원 가능하며 이후 R2 삭제 후보가 됩니다.",
    },
    {
      label: "용량 계산",
      value: policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중 파일만",
      description: policySettings.includeTrashInUsage ? "R2 원본이 실제 삭제되기 전까지 휴지통 파일도 사용량에 포함합니다." : "휴지통 파일은 사용량 합산에서 제외합니다.",
    },
    {
      label: "보관기간",
      value: `${COMPANY_FILE_TRASH_RETENTION_DAYS}일`,
      description: "전 고객 공통 30일 기준으로 실제 삭제 후보가 되는 시점을 계산합니다.",
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
      softDeleteEnabled: true,
      includeTrashInUsage: policySettings.includeTrashInUsage,
      trashRetentionDays: COMPANY_FILE_TRASH_RETENTION_DAYS,
    },
  };
}

export function buildAdminStoragePolicyBadges(policySettings: AdminStoragePolicySettings): { label: string; value: string }[] {
  return [
    { label: "삭제 방식", value: "휴지통" },
    { label: "용량 계산", value: policySettings.includeTrashInUsage ? "휴지통 포함" : "사용중 파일만" },
    { label: "파일 보관 기간", value: `${COMPANY_FILE_TRASH_RETENTION_DAYS}일 고정` },
  ];
}

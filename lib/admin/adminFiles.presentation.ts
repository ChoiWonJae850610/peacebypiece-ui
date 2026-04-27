import type {
  AdminFileSortKey,
  AdminFileTabItem,
  AdminFileUsageCard,
  AdminManagedFileItem,
  AdminStoragePolicyItem,
  AdminStorageUsageSummary,
  AdminTrashFileItem,
} from "@/lib/admin/adminFiles.types";

export type { AdminFileTabKey } from "@/lib/admin/adminFiles.types";

export const ADMIN_FILE_USAGE_SUMMARY: AdminStorageUsageSummary = {
  usedBytes: 2147483648,
  limitBytes: 5368709120,
  usedLabel: "2.0GB",
  limitLabel: "5GB",
  usagePercent: 40,
  statusLabel: "정상",
  statusTone: "normal",
};

export const ADMIN_FILE_USAGE_CARDS: AdminFileUsageCard[] = [
  { label: "전체 사용량", value: "2.0GB / 5GB", description: "휴지통 보관 파일 포함" },
  { label: "첨부파일", value: "3개", description: "작지에 연결된 이미지, PDF, 기타 파일" },
  { label: "휴지통", value: "2개", description: "소프트 삭제 후 보관 중인 파일" },
  { label: "복구 가능 기간", value: "30일", description: "purge_after_at 기준" },
];

export const ADMIN_FILE_TABS: AdminFileTabItem[] = [
  {
    key: "attachments",
    label: "첨부파일 목록",
    description: "작지명, 파일명, 파일 유형, 용량, 등록자를 함께 확인",
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
  { key: "workorder", label: "작지명순" },
];

export const ADMIN_FILE_LIST_PLACEHOLDERS: AdminManagedFileItem[] = [
  {
    id: "sample-attachment-1",
    workorderId: "sample-workorder-1",
    workorderTitle: "샘플 작지 A",
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
    workorderTitle: "샘플 작지 B",
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
    workorderTitle: "샘플 작지 C",
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
    workorderTitle: "샘플 작지 A",
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
    workorderTitle: "샘플 작지 B",
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
    value: "30일 이후",
    description: "purge_after_at 이후 dryRun 검토 후 /api/admin/files/trash/purge-worker가 R2 원본과 썸네일 삭제",
  },
];

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

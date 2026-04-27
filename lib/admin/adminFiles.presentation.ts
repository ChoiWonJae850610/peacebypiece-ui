import type {
  AdminFileTabItem,
  AdminFileUsageCard,
  AdminManagedFileItem,
  AdminStoragePolicyItem,
  AdminTrashFileItem,
} from "@/lib/admin/adminFiles.types";

export type { AdminFileTabKey } from "@/lib/admin/adminFiles.types";

export const ADMIN_FILE_USAGE_CARDS: AdminFileUsageCard[] = [
  { label: "전체 사용량", value: "0GB / 5GB", description: "현재 고객사 첨부파일 저장소 기준" },
  { label: "첨부파일", value: "0개", description: "작지에 연결된 이미지, PDF, 기타 파일" },
  { label: "휴지통", value: "0개", description: "소프트 삭제 후 보관 중인 파일" },
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

export const ADMIN_FILE_LIST_PLACEHOLDERS: AdminManagedFileItem[] = [
  {
    id: "sample-attachment-1",
    workorderId: "sample-workorder-1",
    workorderTitle: "샘플 작지",
    fileName: "design-reference.png",
    fileType: "이미지",
    fileSizeBytes: 0,
    fileSizeLabel: "0MB",
    uploadedAt: "DB 연결 예정",
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
    attachmentId: "sample-attachment-2",
    workorderId: "sample-workorder-1",
    workorderTitle: "샘플 작지",
    fileName: "removed-reference.pdf",
    fileSizeBytes: 0,
    fileSizeLabel: "0MB",
    deletedAt: "DB 연결 예정",
    deletedBy: "관리자",
    purgeAfterAt: "30일 후",
    deleteReason: "휴지통 정책 표시용 샘플",
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
    description: "purge_after_at 이후 별도 정리 작업에서 R2 원본과 썸네일 삭제",
  },
];

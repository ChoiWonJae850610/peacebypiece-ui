export type AdminFileUsageCard = {
  label: string;
  value: string;
  description: string;
};

export type AdminFileManagementItem = {
  title: string;
  description: string;
  status: string;
};

export type AdminFileTrashPolicyItem = {
  label: string;
  value: string;
  description: string;
};

export const ADMIN_FILE_USAGE_CARDS: AdminFileUsageCard[] = [
  { label: "전체 사용량", value: "0GB / 5GB", description: "현재 고객사 첨부파일 저장소 기준" },
  { label: "첨부파일", value: "0개", description: "작지에 연결된 이미지, PDF, 기타 파일" },
  { label: "휴지통", value: "0개", description: "소프트 삭제 후 보관 중인 파일" },
  { label: "복구 가능 기간", value: "30일", description: "attachment_trash_items.purge_after_at 기준" },
];

export const ADMIN_FILE_MANAGEMENT_ITEMS: AdminFileManagementItem[] = [
  {
    title: "작지별 첨부파일 목록",
    description: "작지명, 파일명, 파일 유형, 용량, 등록일, 등록자를 함께 확인하는 영역",
    status: "DB 조회 연결 예정",
  },
  {
    title: "휴지통",
    description: "삭제 요청된 파일을 즉시 R2에서 제거하지 않고 복구 가능한 상태로 보관하는 영역",
    status: "attachment_trash_items 테이블 추가 완료 / 조회 연결 예정",
  },
  {
    title: "용량 추가 요청",
    description: "고객사별 저장소 사용량을 기준으로 추가 용량 요청 또는 과금 정책을 연결하는 영역",
    status: "운영 정책 확정 후 연결",
  },
];

export const ADMIN_FILE_TRASH_POLICY_ITEMS: AdminFileTrashPolicyItem[] = [
  {
    label: "삭제 방식",
    value: "소프트 삭제",
    description: "삭제 시 attachments.deleted_at과 attachment_trash_items에 보관 정보를 남기는 구조",
  },
  {
    label: "용량 계산",
    value: "계속 포함",
    description: "휴지통 보관 중인 파일은 실제 R2 삭제 전까지 사용량에 포함",
  },
  {
    label: "실제 삭제",
    value: "30일 이후",
    description: "purge_after_at 이후 별도 정리 작업에서 R2 원본과 썸네일 삭제",
  },
];

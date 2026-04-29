export const HISTORY_LOG_ACTION_TYPES = [
  "WORKORDER_CREATED",
  "STATUS_CHANGED",
  "FILE_UPLOADED",
  "FILE_DELETED",
  "PARTNER_UPDATED",
  "SETTINGS_CHANGED",
] as const;

export type HistoryLogActionType = (typeof HISTORY_LOG_ACTION_TYPES)[number];

export const HISTORY_LOG_TARGET_TYPES = [
  "workorder",
  "file",
  "partner",
  "settings",
] as const;

export type HistoryLogTargetType = (typeof HISTORY_LOG_TARGET_TYPES)[number];

export const HISTORY_LOG_ACTION_LABELS: Record<HistoryLogActionType, string> = {
  WORKORDER_CREATED: "작업지시서 생성",
  STATUS_CHANGED: "상태 변경",
  FILE_UPLOADED: "파일 업로드",
  FILE_DELETED: "파일 삭제",
  PARTNER_UPDATED: "거래처 수정",
  SETTINGS_CHANGED: "환경설정 변경",
};

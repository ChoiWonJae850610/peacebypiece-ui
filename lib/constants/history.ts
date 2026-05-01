export const HISTORY_LOG_ACTION_TYPES = [
  "WORKORDER_CREATED",
  "STATUS_CHANGED",
  "FILE_UPLOADED",
  "FILE_DELETED",
  "PARTNER_CREATED",
  "PARTNER_UPDATED",
  "PARTNER_DELETED",
  "SETTINGS_CHANGED",
] as const;

export type HistoryLogActionType = (typeof HISTORY_LOG_ACTION_TYPES)[number];

export const ADMIN_VISIBLE_HISTORY_LOG_ACTION_TYPES = [
  "WORKORDER_CREATED",
  "STATUS_CHANGED",
  "FILE_UPLOADED",
  "FILE_DELETED",
  "PARTNER_CREATED",
  "PARTNER_UPDATED",
  "PARTNER_DELETED",
] as const satisfies readonly HistoryLogActionType[];

export type AdminVisibleHistoryLogActionType = (typeof ADMIN_VISIBLE_HISTORY_LOG_ACTION_TYPES)[number];

export const HISTORY_LOG_TARGET_TYPES = [
  "workorder",
  "file",
  "partner",
  "settings",
] as const;

export type HistoryLogTargetType = (typeof HISTORY_LOG_TARGET_TYPES)[number];

export const ADMIN_VISIBLE_HISTORY_LOG_TARGET_TYPES = [
  "workorder",
  "file",
  "partner",
] as const satisfies readonly HistoryLogTargetType[];

export const HISTORY_LOG_ACTION_LABELS: Record<HistoryLogActionType, string> = {
  WORKORDER_CREATED: "작업지시서 생성",
  STATUS_CHANGED: "상태 변경",
  FILE_UPLOADED: "파일 업로드",
  FILE_DELETED: "파일 삭제",
  PARTNER_CREATED: "협력업체 등록",
  PARTNER_UPDATED: "협력업체 수정",
  PARTNER_DELETED: "협력업체 삭제",
  SETTINGS_CHANGED: "환경설정 변경",
};

const ADMIN_VISIBLE_HISTORY_LOG_ACTION_SET = new Set<string>(ADMIN_VISIBLE_HISTORY_LOG_ACTION_TYPES);
const ADMIN_VISIBLE_HISTORY_LOG_TARGET_SET = new Set<string>(ADMIN_VISIBLE_HISTORY_LOG_TARGET_TYPES);

export function isAdminVisibleHistoryLogAction(value: string | null | undefined): value is AdminVisibleHistoryLogActionType {
  if (!value) return false;
  return ADMIN_VISIBLE_HISTORY_LOG_ACTION_SET.has(value.trim().toUpperCase());
}

export function isAdminVisibleHistoryLogTarget(value: string | null | undefined): value is (typeof ADMIN_VISIBLE_HISTORY_LOG_TARGET_TYPES)[number] {
  if (!value) return false;
  return ADMIN_VISIBLE_HISTORY_LOG_TARGET_SET.has(value.trim().toLowerCase());
}

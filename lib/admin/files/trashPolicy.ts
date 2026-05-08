export const ADMIN_FILE_TRASH_REASONS = {
  workorderBundle: "작업지시서 삭제로 함께 휴지통 이동",
} as const;

export type AdminFileTrashReason =
  (typeof ADMIN_FILE_TRASH_REASONS)[keyof typeof ADMIN_FILE_TRASH_REASONS];

export function isWorkOrderBundleTrashReason(
  reason: string | null | undefined,
): boolean {
  return reason === ADMIN_FILE_TRASH_REASONS.workorderBundle;
}

export const ADMIN_FILE_TRASH_ACTOR_IDS = {
  workorderDelete: "workorder-delete",
} as const;

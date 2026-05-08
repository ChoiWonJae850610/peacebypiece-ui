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

export const ADMIN_FILE_TRASH_PURGE_STATUSES = {
  pending: "pending",
  purgeRequested: "purge_requested",
  purged: "purged",
  restored: "restored",
  failed: "failed",
} as const;

export type AdminFileTrashPurgeStatus =
  (typeof ADMIN_FILE_TRASH_PURGE_STATUSES)[keyof typeof ADMIN_FILE_TRASH_PURGE_STATUSES];

const ADMIN_FILE_TRASH_PURGE_STATUS_SET = new Set<string>(
  Object.values(ADMIN_FILE_TRASH_PURGE_STATUSES),
);

export function normalizeAdminFileTrashPurgeStatus(
  status: string | null | undefined,
): AdminFileTrashPurgeStatus {
  if (status && ADMIN_FILE_TRASH_PURGE_STATUS_SET.has(status)) {
    return status as AdminFileTrashPurgeStatus;
  }
  return ADMIN_FILE_TRASH_PURGE_STATUSES.pending;
}

export function getAdminFileTrashVisiblePurgeStatus(input: {
  status: string | null | undefined;
  lastPurgeError?: string | null | undefined;
}): AdminFileTrashPurgeStatus {
  if (input.lastPurgeError) return ADMIN_FILE_TRASH_PURGE_STATUSES.failed;
  return normalizeAdminFileTrashPurgeStatus(input.status);
}

export function isAdminFileTrashPendingStatus(
  status: string | null | undefined,
): boolean {
  return normalizeAdminFileTrashPurgeStatus(status) === ADMIN_FILE_TRASH_PURGE_STATUSES.pending;
}

export function isAdminFileTrashPurgeRequestedStatus(
  status: string | null | undefined,
): boolean {
  return normalizeAdminFileTrashPurgeStatus(status) === ADMIN_FILE_TRASH_PURGE_STATUSES.purgeRequested;
}

export const ADMIN_WORKORDER_DELETE_STATUSES = {
  active: "active",
  deleted: "deleted",
  purgeRequested: "purge_requested",
  purged: "purged",
} as const;

export const ADMIN_WORKORDER_PURGE_STATUSES = {
  none: "none",
  pending: "pending",
  purgeRequested: "purge_requested",
  purged: "purged",
  failed: "failed",
} as const;

export const ADMIN_FILE_TRASH_ACTOR_IDS = {
  workorderDelete: "workorder-delete",
  systemStoragePurge: "system-storage-purge",
} as const;

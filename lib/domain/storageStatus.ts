import type { AdminFileLifecycleStatus, AdminFileStatus, AdminTrashPurgeStatus } from "@/lib/admin/files/types";

export const ADMIN_FILE_LIFECYCLE_STATUS_CODE = {
  active: "ACTIVE",
  deleted: "DELETED",
  temp: "TEMP",
} as const satisfies Record<string, AdminFileLifecycleStatus>;

export const ADMIN_TRASH_PURGE_STATUS = {
  pending: "pending",
  purgeRequested: "purge_requested",
  processing: "processing",
  purged: "purged",
  failed: "failed",
  restored: "restored",
} as const satisfies Record<string, AdminTrashPurgeStatus>;

export const ADMIN_TRASH_PURGE_STATUSES = [
  ADMIN_TRASH_PURGE_STATUS.pending,
  ADMIN_TRASH_PURGE_STATUS.purgeRequested,
  ADMIN_TRASH_PURGE_STATUS.processing,
  ADMIN_TRASH_PURGE_STATUS.purged,
  ADMIN_TRASH_PURGE_STATUS.failed,
  ADMIN_TRASH_PURGE_STATUS.restored,
] as const satisfies readonly AdminTrashPurgeStatus[];

export function isAdminTrashPurgeStatus(value: string | null | undefined): value is AdminTrashPurgeStatus {
  return ADMIN_TRASH_PURGE_STATUSES.includes(value as AdminTrashPurgeStatus);
}

export function normalizeAdminFileLifecycleStatusCode(status: AdminFileStatus): AdminFileLifecycleStatus {
  if (status === "active" || status === ADMIN_FILE_LIFECYCLE_STATUS_CODE.active) {
    return ADMIN_FILE_LIFECYCLE_STATUS_CODE.active;
  }

  if (
    status === "trashed" ||
    status === ADMIN_TRASH_PURGE_STATUS.purged ||
    status === ADMIN_FILE_LIFECYCLE_STATUS_CODE.deleted
  ) {
    return ADMIN_FILE_LIFECYCLE_STATUS_CODE.deleted;
  }

  return ADMIN_FILE_LIFECYCLE_STATUS_CODE.temp;
}

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

export const ADMIN_DELETE_SOURCES = {
  manual: "manual",
  workorderBundle: "workorder_bundle",
  system: "system",
} as const;

export const ADMIN_DELETE_SCOPES = {
  single: "single",
  bundle: "bundle",
} as const;

export const ADMIN_DELETE_PARENT_TYPES = {
  none: "none",
  workorder: "workorder",
} as const;

export type AdminDeleteSource =
  (typeof ADMIN_DELETE_SOURCES)[keyof typeof ADMIN_DELETE_SOURCES];

export type AdminDeleteScope =
  (typeof ADMIN_DELETE_SCOPES)[keyof typeof ADMIN_DELETE_SCOPES];

export type AdminDeleteParentType =
  (typeof ADMIN_DELETE_PARENT_TYPES)[keyof typeof ADMIN_DELETE_PARENT_TYPES];

export function isWorkOrderBundleTrashMetadata(input: {
  deleteSource?: string | null | undefined;
  deleteReason?: string | null | undefined;
}): boolean {
  return (
    input.deleteSource === ADMIN_DELETE_SOURCES.workorderBundle ||
    isWorkOrderBundleTrashReason(input.deleteReason)
  );
}

export const ADMIN_FILE_TRASH_PURGE_STATUSES = {
  pending: "pending",
  purgeRequested: "purge_requested",
  purged: "purged",
  restored: "restored",
  failed: "failed",
  processing: "processing",
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
  return (
    normalizeAdminFileTrashPurgeStatus(status) ===
    ADMIN_FILE_TRASH_PURGE_STATUSES.pending
  );
}

export function isAdminFileTrashPurgeRequestedStatus(
  status: string | null | undefined,
): boolean {
  return (
    normalizeAdminFileTrashPurgeStatus(status) ===
    ADMIN_FILE_TRASH_PURGE_STATUSES.purgeRequested
  );
}

function quoteAdminTrashSqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function joinAdminTrashSqlLiterals(values: readonly string[]): string {
  return values.map(quoteAdminTrashSqlLiteral).join(", ");
}

export const ADMIN_FILE_TRASH_PURGE_STATUS_SQL = {
  pending: quoteAdminTrashSqlLiteral(ADMIN_FILE_TRASH_PURGE_STATUSES.pending),
  purgeRequested: quoteAdminTrashSqlLiteral(
    ADMIN_FILE_TRASH_PURGE_STATUSES.purgeRequested,
  ),
  purged: quoteAdminTrashSqlLiteral(ADMIN_FILE_TRASH_PURGE_STATUSES.purged),
  restored: quoteAdminTrashSqlLiteral(ADMIN_FILE_TRASH_PURGE_STATUSES.restored),
  failed: quoteAdminTrashSqlLiteral(ADMIN_FILE_TRASH_PURGE_STATUSES.failed),
  processing: quoteAdminTrashSqlLiteral(
    ADMIN_FILE_TRASH_PURGE_STATUSES.processing,
  ),
} as const;

export const ADMIN_FILE_TRASH_OPEN_PURGE_STATUSES = [
  ADMIN_FILE_TRASH_PURGE_STATUSES.pending,
  ADMIN_FILE_TRASH_PURGE_STATUSES.purgeRequested,
] as const;

export const ADMIN_FILE_TRASH_SYSTEM_CANDIDATE_PURGE_STATUSES = [
  ADMIN_FILE_TRASH_PURGE_STATUSES.pending,
  ADMIN_FILE_TRASH_PURGE_STATUSES.purgeRequested,
  ADMIN_FILE_TRASH_PURGE_STATUSES.failed,
] as const;

export const ADMIN_FILE_TRASH_OPEN_PURGE_STATUS_SQL_LIST =
  joinAdminTrashSqlLiterals(ADMIN_FILE_TRASH_OPEN_PURGE_STATUSES);

export const ADMIN_FILE_TRASH_SYSTEM_CANDIDATE_PURGE_STATUS_SQL_LIST =
  joinAdminTrashSqlLiterals(ADMIN_FILE_TRASH_SYSTEM_CANDIDATE_PURGE_STATUSES);

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
  processing: "processing",
  purged: "purged",
  failed: "failed",
} as const;

export const ADMIN_WORKORDER_DELETE_STATUS_SQL = {
  active: quoteAdminTrashSqlLiteral(ADMIN_WORKORDER_DELETE_STATUSES.active),
  deleted: quoteAdminTrashSqlLiteral(ADMIN_WORKORDER_DELETE_STATUSES.deleted),
  purgeRequested: quoteAdminTrashSqlLiteral(
    ADMIN_WORKORDER_DELETE_STATUSES.purgeRequested,
  ),
  purged: quoteAdminTrashSqlLiteral(ADMIN_WORKORDER_DELETE_STATUSES.purged),
} as const;

export const ADMIN_WORKORDER_PURGE_STATUS_SQL = {
  none: quoteAdminTrashSqlLiteral(ADMIN_WORKORDER_PURGE_STATUSES.none),
  pending: quoteAdminTrashSqlLiteral(ADMIN_WORKORDER_PURGE_STATUSES.pending),
  purgeRequested: quoteAdminTrashSqlLiteral(
    ADMIN_WORKORDER_PURGE_STATUSES.purgeRequested,
  ),
  processing: quoteAdminTrashSqlLiteral(
    ADMIN_WORKORDER_PURGE_STATUSES.processing,
  ),
  purged: quoteAdminTrashSqlLiteral(ADMIN_WORKORDER_PURGE_STATUSES.purged),
  failed: quoteAdminTrashSqlLiteral(ADMIN_WORKORDER_PURGE_STATUSES.failed),
} as const;

export const ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_DELETE_STATUSES = [
  ADMIN_WORKORDER_DELETE_STATUSES.purgeRequested,
  ADMIN_WORKORDER_DELETE_STATUSES.purged,
] as const;

export const ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_PURGE_STATUSES = [
  ADMIN_WORKORDER_PURGE_STATUSES.purgeRequested,
  ADMIN_WORKORDER_PURGE_STATUSES.purged,
] as const;

export const ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_DELETE_STATUS_SQL_LIST =
  joinAdminTrashSqlLiterals(ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_DELETE_STATUSES);

export const ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_PURGE_STATUS_SQL_LIST =
  joinAdminTrashSqlLiterals(ADMIN_WORKORDER_ADMIN_TRASH_HIDDEN_PURGE_STATUSES);

export const ADMIN_WORKORDER_SYSTEM_CANDIDATE_PURGE_STATUS_SQL_LIST =
  joinAdminTrashSqlLiterals([
    ADMIN_WORKORDER_PURGE_STATUSES.pending,
    ADMIN_WORKORDER_PURGE_STATUSES.purgeRequested,
    ADMIN_WORKORDER_PURGE_STATUSES.failed,
  ] as const);

export const ADMIN_FILE_TRASH_ACTOR_IDS = {
  workorderDelete: "workorder-delete",
  systemStoragePurge: "system-storage-purge",
} as const;

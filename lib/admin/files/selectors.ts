import {
  selectAdminTrashItemsByIds as selectAdminTrashItemsByIdsFromPolicy,
} from "@/lib/admin/files/trashPolicy";
import type { AdminFileSortKey, AdminManagedFileItem, AdminTrashFileItem } from "@/lib/admin/files/types";
import { ADMIN_FILE_LIFECYCLE_STATUS, type AdminFileLifecycleStatus } from "@/lib/admin/files/types";
import { normalizeAdminFileLifecycleStatusCode } from "@/lib/domain/storageStatus";

export function normalizeAdminFileLifecycleStatus(status: AdminManagedFileItem["status"]): AdminFileLifecycleStatus {
  return normalizeAdminFileLifecycleStatusCode(status);
}

export function selectActiveAdminManagedFiles(items: AdminManagedFileItem[]): AdminManagedFileItem[] {
  return items.filter((item) => normalizeAdminFileLifecycleStatus(item.status) === ADMIN_FILE_LIFECYCLE_STATUS.ACTIVE);
}

export function selectTempAdminManagedFiles(items: AdminManagedFileItem[]): AdminManagedFileItem[] {
  return items.filter((item) => normalizeAdminFileLifecycleStatus(item.status) === ADMIN_FILE_LIFECYCLE_STATUS.TEMP);
}

export function selectDeletedAdminManagedFiles(items: AdminManagedFileItem[]): AdminManagedFileItem[] {
  return items.filter((item) => normalizeAdminFileLifecycleStatus(item.status) === ADMIN_FILE_LIFECYCLE_STATUS.DELETED);
}

export function sortAdminManagedFiles(items: AdminManagedFileItem[], sortKey: AdminFileSortKey): AdminManagedFileItem[] {
  return [...items].sort((a, b) => {
    if (sortKey === "size") return b.fileSizeBytes - a.fileSizeBytes;
    if (sortKey === "workorder") return a.workorderTitle.localeCompare(b.workorderTitle, "ko");
    return b.uploadedAt.localeCompare(a.uploadedAt);
  });
}

export function selectAdminManagedFilesByIds(items: AdminManagedFileItem[], selectedIds: string[]): AdminManagedFileItem[] {
  if (selectedIds.length === 0) return [];
  const selectedIdSet = new Set(selectedIds);
  return items.filter((item) => selectedIdSet.has(item.id));
}

export function selectAdminTrashItemsByIds(items: AdminTrashFileItem[], selectedIds: string[]): AdminTrashFileItem[] {
  return selectAdminTrashItemsByIdsFromPolicy(items, selectedIds);
}

export function toggleAdminSelectedId(currentIds: string[], targetId: string): string[] {
  return currentIds.includes(targetId) ? currentIds.filter((id) => id !== targetId) : [...currentIds, targetId];
}

export function buildAdminSelectAllIds<T extends { id: string }>(items: T[], currentIds: string[]): string[] {
  return currentIds.length === items.length ? [] : items.map((item) => item.id);
}

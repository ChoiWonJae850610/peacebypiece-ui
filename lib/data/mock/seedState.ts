import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { buildUserSeedSource } from "@/lib/data/mock/users";
import { buildWorkOrderSeedSource } from "@/lib/data/mock/workorders";
import type { PersistedWorkOrderState } from "@/lib/data/mock/types";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

function cloneSeedValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getSeedUsers(locale: Locale = DEFAULT_LOCALE): UserProfile[] {
  return cloneSeedValue(buildUserSeedSource(locale).users);
}

export function getSeedWorkOrders(locale: Locale = DEFAULT_LOCALE): WorkOrder[] {
  return cloneSeedValue(buildWorkOrderSeedSource(locale).workOrders);
}

export function getSeedHistoryLogs(locale: Locale = DEFAULT_LOCALE): HistoryLog[] {
  return cloneSeedValue(buildWorkOrderSeedSource(locale).historyLogs);
}

export function createInitialSeededWorkorderState(locale: Locale = DEFAULT_LOCALE): PersistedWorkOrderState {
  const userSeed = buildUserSeedSource(locale);
  const workOrderSeed = buildWorkOrderSeedSource(locale);

  return {
    users: cloneSeedValue(userSeed.users),
    workOrders: cloneSeedValue(workOrderSeed.workOrders),
    historyLogs: cloneSeedValue(workOrderSeed.historyLogs),
    selectedId: workOrderSeed.defaultSelectedId,
    currentUserId: userSeed.defaultCurrentUserId,
    permissionTargetUserId: userSeed.defaultPermissionTargetId,
  };
}

export function cloneSavedWorkOrders(workOrders: WorkOrder[]) {
  return cloneSeedValue(workOrders);
}

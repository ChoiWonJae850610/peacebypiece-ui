import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from "@/lib/constants/app";
import type { PersistedWorkOrderState } from "@/lib/data/mock/types";
import { loadJsonFromStorage, persistJsonToStorage } from "@/lib/repositories/browserStorage";

function getStorageKeys(): string[] {
  return [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
}

export function loadPersistedWorkorderState(): PersistedWorkOrderState | null {
  return loadJsonFromStorage<PersistedWorkOrderState>(getStorageKeys());
}

export function persistWorkorderState(payload: PersistedWorkOrderState) {
  persistJsonToStorage(STORAGE_KEY, payload, LEGACY_STORAGE_KEYS);
}

export function loadPersistedWorkspaceState(): PersistedWorkOrderState | null {
  return loadPersistedWorkorderState();
}

export function persistWorkspaceState(payload: PersistedWorkOrderState) {
  persistWorkorderState(payload);
}

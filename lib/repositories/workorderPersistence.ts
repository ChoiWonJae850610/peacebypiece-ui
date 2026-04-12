import { LEGACY_STORAGE_KEYS, STORAGE_KEY } from "@/lib/constants/app";
import type { PersistedWorkOrderState } from "@/lib/data/mock/types";

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function getStorageKeys(): string[] {
  return [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
}

export function loadPersistedWorkorderState(): PersistedWorkOrderState | null {
  if (typeof window === "undefined") return null;

  for (const key of getStorageKeys()) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") continue;
      return cloneValue(parsed as PersistedWorkOrderState);
    } catch {
      continue;
    }
  }

  return null;
}

export function persistWorkorderState(payload: PersistedWorkOrderState) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    window.localStorage.removeItem(legacyKey);
  }
}

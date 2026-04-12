function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function loadJsonFromStorage<T>(keys: readonly string[]): T | null {
  if (typeof window === "undefined") return null;

  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") continue;
      return cloneValue(parsed as T);
    } catch {
      continue;
    }
  }

  return null;
}

export function persistJsonToStorage<T>(key: string, payload: T, legacyKeys: readonly string[] = []) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(payload));
  for (const legacyKey of legacyKeys) {
    window.localStorage.removeItem(legacyKey);
  }
}

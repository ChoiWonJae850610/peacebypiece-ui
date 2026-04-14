import { loadJsonFromStorage, persistJsonToStorage } from "@/lib/repositories/browserStorage";

export const CATEGORY_RULE_STORAGE_KEY = "peacebypiece.system.categoryRules.v1";
export const CATEGORY_TREE_STORAGE_KEY = "peacebypiece.system.categoryTree.v1";

export type PersistedCategorySystemJson = {
  rules: unknown | null;
  tree: unknown | null;
};

export function loadPersistedCategoryRulesJson(): unknown | null {
  return loadJsonFromStorage<unknown>([CATEGORY_RULE_STORAGE_KEY]);
}

export function persistCategoryRules(payload: unknown) {
  persistJsonToStorage(CATEGORY_RULE_STORAGE_KEY, payload);
}

export function removePersistedCategoryRules() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CATEGORY_RULE_STORAGE_KEY);
}

export function loadPersistedCategoryTreeJson(): unknown | null {
  return loadJsonFromStorage<unknown>([CATEGORY_TREE_STORAGE_KEY]);
}

export function persistCategoryTreeState(payload: unknown) {
  persistJsonToStorage(CATEGORY_TREE_STORAGE_KEY, payload);
}

export function removePersistedCategoryTree() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CATEGORY_TREE_STORAGE_KEY);
}

export function loadPersistedCategorySystemJson(): PersistedCategorySystemJson {
  return {
    rules: loadPersistedCategoryRulesJson(),
    tree: loadPersistedCategoryTreeJson(),
  };
}

import { CATEGORY_TREE } from "@/lib/constants/workorderCategories";

export const CATEGORY_TREE_STORAGE_KEY = "peacebypiece.system.categoryTree.v1";

export type CategoryTreeRuntime = Record<string, Record<string, string[]>>;

function cloneDefaultTree(): CategoryTreeRuntime {
  return Object.fromEntries(
    Object.entries(CATEGORY_TREE).map(([category1, category2Map]) => [
      category1,
      Object.fromEntries(
        Object.entries(category2Map).map(([category2, category3List]) => [category2, [...category3List]]),
      ),
    ]),
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function sanitizeCategoryTree(tree: unknown): CategoryTreeRuntime {
  if (!tree || typeof tree !== "object") {
    return cloneDefaultTree();
  }

  const normalized = Object.fromEntries(
    Object.entries(tree as Record<string, unknown>)
      .map(([category1, category2Map]) => {
        if (typeof category1 !== "string") return null;
        if (!category2Map || typeof category2Map !== "object") return null;

        const normalizedCategory1 = category1.trim();
        if (!normalizedCategory1) return null;

        const normalizedCategory2Map = Object.fromEntries(
          Object.entries(category2Map as Record<string, unknown>)
            .map(([category2, category3List]) => {
              const normalizedCategory2 = String(category2 ?? "").trim();
              if (!normalizedCategory2) return null;

              const normalizedCategory3 = Array.isArray(category3List)
                ? unique(category3List.map((item) => String(item ?? "")))
                : [];

              return [normalizedCategory2, normalizedCategory3] as const;
            })
            .filter((entry): entry is readonly [string, string[]] => Boolean(entry)),
        );

        if (Object.keys(normalizedCategory2Map).length === 0) {
          normalizedCategory2Map["미분류"] = ["기본"];
        }

        return [normalizedCategory1, normalizedCategory2Map] as const;
      })
      .filter((entry): entry is readonly [string, Record<string, string[]>] => Boolean(entry)),
  );

  return Object.keys(normalized).length > 0 ? normalized : cloneDefaultTree();
}

export function getStoredCategoryTree(): CategoryTreeRuntime | null {
  if (typeof window === "undefined" || !window.localStorage) return null;

  const saved = window.localStorage.getItem(CATEGORY_TREE_STORAGE_KEY);
  if (!saved) return null;

  try {
    return sanitizeCategoryTree(JSON.parse(saved));
  } catch {
    return null;
  }
}

export function getRuntimeCategoryTree(): CategoryTreeRuntime {
  return getStoredCategoryTree() ?? cloneDefaultTree();
}

export function persistCategoryTree(tree: CategoryTreeRuntime) {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(CATEGORY_TREE_STORAGE_KEY, JSON.stringify(sanitizeCategoryTree(tree)));
}

export function removeStoredCategoryTree() {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(CATEGORY_TREE_STORAGE_KEY);
}

export function getCategory1Options(tree: CategoryTreeRuntime) {
  return Object.keys(tree);
}

export function getCategory2Options(tree: CategoryTreeRuntime, category1: string) {
  return Object.keys(tree[category1] ?? {});
}

export function getCategory3Options(tree: CategoryTreeRuntime, category1: string, category2: string) {
  return [...(tree[category1]?.[category2] ?? [])];
}

export function normalizeRecommendationWithTree(
  recommendation: { category1: string; category2: string; category3: string; reason: string },
  tree: CategoryTreeRuntime,
) {
  const category1Options = getCategory1Options(tree);
  const nextCategory1 = category1Options.includes(recommendation.category1)
    ? recommendation.category1
    : category1Options[0] ?? "미분류";

  const category2Options = getCategory2Options(tree, nextCategory1);
  const nextCategory2 = category2Options.includes(recommendation.category2)
    ? recommendation.category2
    : category2Options[0] ?? "미분류";

  const category3Options = getCategory3Options(tree, nextCategory1, nextCategory2);
  const nextCategory3 = category3Options.includes(recommendation.category3)
    ? recommendation.category3
    : category3Options[0] ?? "기본";

  return {
    ...recommendation,
    category1: nextCategory1,
    category2: nextCategory2,
    category3: nextCategory3,
  };
}

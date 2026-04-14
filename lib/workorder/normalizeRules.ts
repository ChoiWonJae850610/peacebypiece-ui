import { CATEGORY_TREE, DEFAULT_CATEGORY1, DEFAULT_CATEGORY2, DEFAULT_CATEGORY3 } from "@/lib/constants/workorderCategories";
import { DEFAULT_BASIC_YEAR, SEASON_OPTIONS } from "@/lib/constants/workorderOptions";
import type { WorkOrder } from "@/types/workorder";
import { getCategory1OptionsFromTree, getCategory2OptionsFromTree, getCategory3OptionsFromTree } from "@/lib/utils/categoryOptions";

export type CategoryOptionTree = Record<string, Record<string, readonly string[]>>;

export type CategorySelection = {
  category1: string;
  category2: string;
  category3: string;
};

export function buildChildEntityId(parentId: string, prefix: string, index: number) {
  return `${parentId}-${prefix}-${index + 1}`;
}

export function dedupeNormalizedStrings(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export function sanitizeOptionValue(value: string, options: readonly string[], fallback?: string) {
  if (value && options.includes(value)) return value;
  return fallback ?? options[0] ?? "";
}

export function appendUniqueOption(options: string[], value: string) {
  const trimmed = value.trim();
  if (!trimmed || options.includes(trimmed)) return options;
  return [...options, trimmed];
}

export function normalizeCategorySelection(
  selection: Partial<CategorySelection>,
  tree: CategoryOptionTree = CATEGORY_TREE,
): CategorySelection {
  const category1Options = getCategory1OptionsFromTree(tree);
  const category1 = sanitizeOptionValue(selection.category1 ?? "", category1Options, DEFAULT_CATEGORY1);

  const category2Options = getCategory2OptionsFromTree(tree, category1)
    ?? getCategory2OptionsFromTree(tree, DEFAULT_CATEGORY1)
    ?? [DEFAULT_CATEGORY2];
  const category2 = sanitizeOptionValue(selection.category2 ?? "", category2Options, DEFAULT_CATEGORY2);

  const category3Options = getCategory3OptionsFromTree(tree, category1, category2)
    ?? getCategory3OptionsFromTree(tree, DEFAULT_CATEGORY1, DEFAULT_CATEGORY2)
    ?? [DEFAULT_CATEGORY3];
  const category3 = sanitizeOptionValue(selection.category3 ?? "", category3Options, DEFAULT_CATEGORY3);

  return {
    category1,
    category2,
    category3,
  };
}

export function parseSeasonYear(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(SS|FW|NOS|ALL)(?:\s+(\d{4}))?$/i);
  if (match) {
    return {
      season: match[1].toUpperCase(),
      year: match[2] ?? DEFAULT_BASIC_YEAR,
    };
  }

  const [first = "", second = ""] = trimmed.split(/\s+/);
  return {
    season: first || SEASON_OPTIONS[0],
    year: second || DEFAULT_BASIC_YEAR,
  };
}

export function buildInitialBasicInfoFromWorkOrder(workOrder: WorkOrder) {
  const parsedSeason = parseSeasonYear(workOrder.season);
  const category = normalizeCategorySelection({
    category1: workOrder.category1,
    category2: workOrder.category2,
    category3: workOrder.category3,
  });

  return {
    ...category,
    season: parsedSeason.season || SEASON_OPTIONS[0],
    year: parsedSeason.year || DEFAULT_BASIC_YEAR,
  };
}

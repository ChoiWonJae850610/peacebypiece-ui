import { CATEGORY1_OPTIONS, CATEGORY2_OPTIONS_MAP, CATEGORY3_OPTIONS_MAP, DEFAULT_CATEGORY1, DEFAULT_CATEGORY2, DEFAULT_CATEGORY3 } from "@/lib/constants/workorderCategories";
import type { AdminItemCategoryDefinition } from "@/lib/admin/settings/standardsTypes";

export type CategoryOption = {
  id: string | null;
  name: string;
};

export type CategorySource = {
  category1Options: CategoryOption[];
  category2OptionsMap: Record<string, CategoryOption[]>;
  category3OptionsMap: Record<string, CategoryOption[]>;
  defaultCategory1: CategoryOption;
  defaultCategory2: CategoryOption;
  defaultCategory3: CategoryOption;
};

export function createFallbackOption(name: string): CategoryOption {
  return { id: null, name };
}

export function buildDefaultCategorySource(): CategorySource {
  const category1Options = CATEGORY1_OPTIONS.map(createFallbackOption);
  const category2OptionsMap = Object.fromEntries(
    Object.entries(CATEGORY2_OPTIONS_MAP).map(([category1Name, items]) => [category1Name, items.map(createFallbackOption)]),
  );
  const category3OptionsMap = Object.fromEntries(
    Object.entries(CATEGORY3_OPTIONS_MAP).map(([category2Name, items]) => [category2Name, items.map(createFallbackOption)]),
  );

  return {
    category1Options,
    category2OptionsMap,
    category3OptionsMap,
    defaultCategory1: createFallbackOption(DEFAULT_CATEGORY1),
    defaultCategory2: createFallbackOption(DEFAULT_CATEGORY2),
    defaultCategory3: createFallbackOption(DEFAULT_CATEGORY3),
  };
}

function sortCategoryItems(items: AdminItemCategoryDefinition[]) {
  return [...items].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ko-KR"));
}

export function buildCategorySourceFromDefinitions(items: AdminItemCategoryDefinition[]): CategorySource {
  const activeItems = items.filter((item) => item.is_active);
  const level1 = sortCategoryItems(activeItems.filter((item) => item.level === 1));
  const level2 = sortCategoryItems(activeItems.filter((item) => item.level === 2));
  const level3 = sortCategoryItems(activeItems.filter((item) => item.level === 3));

  if (level1.length === 0) return buildDefaultCategorySource();

  const category2OptionsMap: Record<string, CategoryOption[]> = {};
  const category3OptionsMap: Record<string, CategoryOption[]> = {};

  level1.forEach((category1) => {
    category2OptionsMap[category1.name] = level2
      .filter((category2) => category2.parent_id === category1.id)
      .map((category2) => ({ id: category2.id, name: category2.name }));
  });

  level2.forEach((category2) => {
    category3OptionsMap[category2.name] = level3
      .filter((category3) => category3.parent_id === category2.id)
      .map((category3) => ({ id: category3.id, name: category3.name }));
  });

  const defaultCategory1 = { id: level1[0]?.id ?? null, name: level1[0]?.name ?? DEFAULT_CATEGORY1 };
  const defaultCategory2 = category2OptionsMap[defaultCategory1.name]?.[0] ?? createFallbackOption(DEFAULT_CATEGORY2);
  const defaultCategory3 = category3OptionsMap[defaultCategory2.name]?.[0] ?? createFallbackOption(DEFAULT_CATEGORY3);

  return {
    category1Options: level1.map((item) => ({ id: item.id, name: item.name })),
    category2OptionsMap,
    category3OptionsMap,
    defaultCategory1,
    defaultCategory2,
    defaultCategory3,
  };
}

export function findCategoryOption(options: CategoryOption[], name: string, fallback: CategoryOption): CategoryOption {
  return options.find((option) => option.name === name) ?? fallback;
}

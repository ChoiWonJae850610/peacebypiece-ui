export type CategoryOptionTree = Record<string, Record<string, readonly string[] | string[]>>;

export function getCategory1OptionsFromTree(tree: CategoryOptionTree): string[] {
  return Object.keys(tree);
}

export function getCategory2OptionsFromTree(tree: CategoryOptionTree, category1: string): string[] {
  return Object.keys(tree[category1] ?? {});
}

export function getCategory3OptionsFromTree(tree: CategoryOptionTree, category1: string, category2: string): string[] {
  return [...(tree[category1]?.[category2] ?? [])];
}

export function getNormalizedCategorySelection(
  tree: CategoryOptionTree,
  category1: string | null | undefined,
  category2: string | null | undefined,
) {
  const category1Options = getCategory1OptionsFromTree(tree);
  const nextCategory1 = category1 && tree[category1] ? category1 : (category1Options[0] ?? "");
  const category2Options = getCategory2OptionsFromTree(tree, nextCategory1);
  const nextCategory2 = category2 && tree[nextCategory1]?.[category2] ? category2 : (category2Options[0] ?? "");

  return {
    category1: nextCategory1,
    category2: nextCategory2,
  };
}

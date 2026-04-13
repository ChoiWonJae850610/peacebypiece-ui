import { DEFAULT_CATEGORY1, DEFAULT_CATEGORY2, DEFAULT_CATEGORY3 } from "@/lib/constants/workorderCategories";
import { WORKORDER_CATEGORY_KEYWORD_RULES, type WorkOrderCategoryKeywordRule, type WorkOrderCategoryRecommendation } from "@/lib/constants/workorderCategoryKeywords";

export function normalizeWorkOrderTitle(title: string) {
  return title.trim().toLowerCase();
}

export function findWorkOrderCategoryKeywordRule(
  title: string,
  rules: WorkOrderCategoryKeywordRule[] = WORKORDER_CATEGORY_KEYWORD_RULES,
): WorkOrderCategoryKeywordRule | null {
  const normalizedTitle = normalizeWorkOrderTitle(title);
  if (!normalizedTitle) return null;

  return rules.find((rule) => rule.keywords.some((keyword) => normalizedTitle.includes(keyword.toLowerCase()))) ?? null;
}

export function getRecommendedWorkOrderCategory(
  title: string,
  rules: WorkOrderCategoryKeywordRule[] = WORKORDER_CATEGORY_KEYWORD_RULES,
): WorkOrderCategoryRecommendation | null {
  return findWorkOrderCategoryKeywordRule(title, rules)?.recommendation ?? null;
}


type WorkOrderCategoryFields = {
  category1?: string | null;
  category2?: string | null;
  category3?: string | null;
};

export function isSameWorkOrderCategory(
  left: WorkOrderCategoryFields | null | undefined,
  right: WorkOrderCategoryFields | null | undefined,
) {
  return (left?.category1 ?? "") === (right?.category1 ?? "")
    && (left?.category2 ?? "") === (right?.category2 ?? "")
    && (left?.category3 ?? "") === (right?.category3 ?? "");
}

export function shouldApplyRecommendedCategoryOnTitleRename(payload: {
  previousTitle: string;
  nextTitle: string;
  currentCategory: WorkOrderCategoryFields;
}) {
  const nextRecommendation = getRecommendedWorkOrderCategory(payload.nextTitle);
  if (!nextRecommendation) {
    return null;
  }

  const previousRecommendation = getRecommendedWorkOrderCategory(payload.previousTitle);
  if (!previousRecommendation) {
    return isSameWorkOrderCategory(payload.currentCategory, {
      category1: DEFAULT_CATEGORY1,
      category2: DEFAULT_CATEGORY2,
      category3: DEFAULT_CATEGORY3,
    })
      ? nextRecommendation
      : null;
  }

  return isSameWorkOrderCategory(payload.currentCategory, previousRecommendation)
    ? nextRecommendation
    : null;
}

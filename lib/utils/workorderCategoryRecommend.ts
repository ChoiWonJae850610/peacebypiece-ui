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

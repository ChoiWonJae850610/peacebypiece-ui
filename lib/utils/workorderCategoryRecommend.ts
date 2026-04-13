import { type WorkOrderCategoryKeywordRule, type WorkOrderCategoryRecommendation } from "@/lib/constants/workorderCategoryKeywords";
import { getActiveWorkOrderCategoryRules } from "@/lib/system/categoryRuleRuntime";

export function normalizeWorkOrderTitle(title: string) {
  return title.trim().toLowerCase();
}

export function findWorkOrderCategoryKeywordRule(
  title: string,
  rules?: WorkOrderCategoryKeywordRule[],
): WorkOrderCategoryKeywordRule | null {
  const normalizedTitle = normalizeWorkOrderTitle(title);
  const runtimeRules = rules ?? getActiveWorkOrderCategoryRules();
  if (!normalizedTitle) return null;

  return runtimeRules.find((rule) => rule.keywords.some((keyword) => normalizedTitle.includes(keyword.toLowerCase()))) ?? null;
}

export function getRecommendedWorkOrderCategory(
  title: string,
  rules?: WorkOrderCategoryKeywordRule[],
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
  void payload.previousTitle;
  void payload.currentCategory;

  return getRecommendedWorkOrderCategory(payload.nextTitle);
}

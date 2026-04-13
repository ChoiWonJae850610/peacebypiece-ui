import { WORKORDER_CATEGORY_KEYWORD_RULES, type WorkOrderCategoryKeywordRule } from "@/lib/constants/workorderCategoryKeywords";

export const CATEGORY_RULE_STORAGE_KEY = "peacebypiece.system.categoryRules.v1";

export type EditableCategoryRuleRuntime = WorkOrderCategoryKeywordRule & {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
};

function sortRuntimeRules(rules: EditableCategoryRuleRuntime[]) {
  return [...rules].sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority;
    return left.name.localeCompare(right.name, "ko");
  });
}

function sanitizeRuntimeRule(rule: EditableCategoryRuleRuntime, index: number): EditableCategoryRuleRuntime {
  const keywords = Array.from(new Set((rule.keywords ?? []).map((keyword) => String(keyword ?? "").trim()).filter(Boolean)));
  const recommendation = rule.recommendation ?? {
    category1: "상의",
    category2: "티셔츠",
    category3: "반팔",
    reason: "추천 사유를 입력하세요.",
  };

  return {
    keywords,
    recommendation: {
      category1: String(recommendation.category1 ?? "").trim() || "상의",
      category2: String(recommendation.category2 ?? "").trim() || "티셔츠",
      category3: String(recommendation.category3 ?? "").trim() || "반팔",
      reason: String(recommendation.reason ?? "").trim() || "추천 사유를 입력하세요.",
    },
    id: String(rule.id ?? `custom-rule-${Date.now()}-${index}`),
    name: String(rule.name ?? "").trim() || `추천 규칙 ${index + 1}`,
    enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
    priority: Number.isFinite(rule.priority) ? rule.priority : (index + 1) * 10,
  };
}

export function sanitizeStoredCategoryRules(rules: EditableCategoryRuleRuntime[]): EditableCategoryRuleRuntime[] {
  return sortRuntimeRules(rules.map((rule, index) => sanitizeRuntimeRule(rule, index)));
}

export function toRuntimeCategoryRules(rules: EditableCategoryRuleRuntime[]): WorkOrderCategoryKeywordRule[] {
  return sortRuntimeRules(rules)
    .filter((rule) => rule.enabled)
    .map(({ keywords, recommendation }) => ({ keywords, recommendation }));
}

function readStoredCategoryRulesFromStorage(storage: Storage): EditableCategoryRuleRuntime[] | null {
  const saved = storage.getItem(CATEGORY_RULE_STORAGE_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as EditableCategoryRuleRuntime[];
    return sanitizeStoredCategoryRules(parsed);
  } catch {
    return null;
  }
}

export function getStoredEditableCategoryRules(): EditableCategoryRuleRuntime[] | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  return readStoredCategoryRulesFromStorage(window.localStorage);
}

export function getActiveWorkOrderCategoryRules(): WorkOrderCategoryKeywordRule[] {
  const storedRules = getStoredEditableCategoryRules();
  return storedRules ? toRuntimeCategoryRules(storedRules) : WORKORDER_CATEGORY_KEYWORD_RULES;
}

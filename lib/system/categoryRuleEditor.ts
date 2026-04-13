import { WORKORDER_CATEGORY_KEYWORD_RULES, type WorkOrderCategoryKeywordRule } from "@/lib/constants/workorderCategoryKeywords";
import { findWorkOrderCategoryKeywordRule, getRecommendedWorkOrderCategory } from "@/lib/utils/workorderCategoryRecommend";

export const CATEGORY_RULE_STORAGE_KEY = "peacebypiece.system.categoryRules.v1";

export type EditableCategoryRule = WorkOrderCategoryKeywordRule & {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
};

export type CategoryRuleMatchPreview = {
  matchedRuleId: string | null;
  matchedRuleName: string | null;
  matchedKeywords: string[];
  recommendationLabel: string | null;
  reason: string | null;
};

function buildRuleId(baseKeyword: string, index: number) {
  return `rule-${index + 1}-${baseKeyword
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export function createDefaultRule(index: number): EditableCategoryRule {
  return {
    id: `custom-rule-${Date.now()}-${index}`,
    name: `새 추천 규칙 ${index + 1}`,
    enabled: true,
    priority: (index + 1) * 10,
    keywords: [],
    recommendation: {
      category1: "상의",
      category2: "티셔츠",
      category3: "반팔",
      reason: "새 규칙에 맞는 추천 사유를 입력하세요.",
    },
  };
}

export function getInitialEditableCategoryRules(): EditableCategoryRule[] {
  return WORKORDER_CATEGORY_KEYWORD_RULES.map((rule, index) => ({
    ...rule,
    id: buildRuleId(rule.keywords[0] ?? `rule-${index + 1}`, index),
    name: `${rule.keywords[0] ?? "규칙"} 추천 규칙`,
    enabled: true,
    priority: (index + 1) * 10,
  }));
}

export function sortEditableCategoryRules(rules: EditableCategoryRule[]): EditableCategoryRule[] {
  return [...rules].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name, "ko");
  });
}

export function sanitizeEditableCategoryRule(rule: EditableCategoryRule, index: number): EditableCategoryRule {
  const keywords = Array.from(new Set(rule.keywords.map((keyword) => keyword.trim()).filter(Boolean)));

  return {
    ...rule,
    id: rule.id || `custom-rule-${Date.now()}-${index}`,
    name: rule.name.trim() || `추천 규칙 ${index + 1}`,
    priority: Number.isFinite(rule.priority) ? rule.priority : (index + 1) * 10,
    keywords,
    recommendation: {
      category1: rule.recommendation.category1.trim() || "상의",
      category2: rule.recommendation.category2.trim() || "티셔츠",
      category3: rule.recommendation.category3.trim() || "반팔",
      reason: rule.recommendation.reason.trim() || "추천 사유를 입력하세요.",
    },
  };
}

export function sanitizeEditableCategoryRules(rules: EditableCategoryRule[]): EditableCategoryRule[] {
  return sortEditableCategoryRules(rules.map((rule, index) => sanitizeEditableCategoryRule(rule, index)));
}

export function toRuntimeCategoryRules(rules: EditableCategoryRule[]): WorkOrderCategoryKeywordRule[] {
  return sortEditableCategoryRules(rules)
    .filter((rule) => rule.enabled)
    .map(({ keywords, recommendation }) => ({ keywords, recommendation }));
}

export function buildCategoryRuleMatchPreview(title: string, rules: EditableCategoryRule[]): CategoryRuleMatchPreview {
  const runtimeRules = toRuntimeCategoryRules(rules);
  const matchedRule = findWorkOrderCategoryKeywordRule(title, runtimeRules);
  const recommendation = getRecommendedWorkOrderCategory(title, runtimeRules);

  if (!matchedRule || !recommendation) {
    return {
      matchedRuleId: null,
      matchedRuleName: null,
      matchedKeywords: [],
      recommendationLabel: null,
      reason: null,
    };
  }

  const enabledRules = sortEditableCategoryRules(rules).filter((rule) => rule.enabled);
  const sourceRule = enabledRules.find(
    (rule) =>
      rule.recommendation.category1 === matchedRule.recommendation.category1 &&
      rule.recommendation.category2 === matchedRule.recommendation.category2 &&
      rule.recommendation.category3 === matchedRule.recommendation.category3 &&
      rule.recommendation.reason === matchedRule.recommendation.reason &&
      rule.keywords.join("|") === matchedRule.keywords.join("|"),
  );

  return {
    matchedRuleId: sourceRule?.id ?? null,
    matchedRuleName: sourceRule?.name ?? null,
    matchedKeywords: matchedRule.keywords.filter((keyword) => title.toLowerCase().includes(keyword.toLowerCase())),
    recommendationLabel: `${recommendation.category1} / ${recommendation.category2} / ${recommendation.category3}`,
    reason: recommendation.reason,
  };
}

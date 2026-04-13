import { WORKORDER_CATEGORY_KEYWORD_RULES, type WorkOrderCategoryKeywordRule } from "@/lib/constants/workorderCategoryKeywords";
import { findWorkOrderCategoryKeywordRule, getRecommendedWorkOrderCategory } from "@/lib/utils/workorderCategoryRecommend";

export type CategoryRuleViewItem = {
  id: string;
  order: number;
  title: string;
  keywords: string[];
  recommendationLabel: string;
  reason: string;
  statusLabel: string;
};

export type CategoryRuleTestResult = {
  matchedRuleId: string | null;
  matchedRuleTitle: string | null;
  matchedKeywords: string[];
  recommendationLabel: string | null;
  reason: string | null;
};

function buildRuleId(rule: WorkOrderCategoryKeywordRule, index: number) {
  const baseKeyword = rule.keywords[0] ?? `rule-${index + 1}`;
  return `rule-${index + 1}-${baseKeyword
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

export function getCategoryRuleViewItems(rules: WorkOrderCategoryKeywordRule[] = WORKORDER_CATEGORY_KEYWORD_RULES): CategoryRuleViewItem[] {
  return rules.map((rule, index) => ({
    id: buildRuleId(rule, index),
    order: index + 1,
    title: `${rule.keywords[0] ?? "규칙"} 추천 규칙`,
    keywords: rule.keywords,
    recommendationLabel: `${rule.recommendation.category1} / ${rule.recommendation.category2} / ${rule.recommendation.category3}`,
    reason: rule.recommendation.reason,
    statusLabel: "사용중",
  }));
}

export function testCategoryRuleTitle(title: string, rules: WorkOrderCategoryKeywordRule[] = WORKORDER_CATEGORY_KEYWORD_RULES): CategoryRuleTestResult {
  const matchedRule = findWorkOrderCategoryKeywordRule(title, rules);
  const recommendation = getRecommendedWorkOrderCategory(title, rules);

  if (!matchedRule || !recommendation) {
    return {
      matchedRuleId: null,
      matchedRuleTitle: null,
      matchedKeywords: [],
      recommendationLabel: null,
      reason: null,
    };
  }

  const matchedKeywords = matchedRule.keywords.filter((keyword) => title.toLowerCase().includes(keyword.toLowerCase()));
  const matchedRuleIndex = rules.indexOf(matchedRule);

  return {
    matchedRuleId: buildRuleId(matchedRule, matchedRuleIndex),
    matchedRuleTitle: `${matchedRule.keywords[0] ?? "규칙"} 추천 규칙`,
    matchedKeywords,
    recommendationLabel: `${recommendation.category1} / ${recommendation.category2} / ${recommendation.category3}`,
    reason: recommendation.reason,
  };
}

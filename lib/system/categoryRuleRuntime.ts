import { WORKORDER_CATEGORY_KEYWORD_RULES, type WorkOrderCategoryKeywordRule } from "@/lib/constants/workorderCategoryKeywords";
import { loadPersistedCategoryRulesJson } from "@/lib/system/categoryPersistence";
import { DEFAULT_CATEGORY_RULE_RECOMMENDATION, getDefaultCategoryRuleReason, getRuntimeCategoryRuleName } from "@/lib/system/categoryRuleDefaults";

export type EditableCategoryRuleRuntime = WorkOrderCategoryKeywordRule & {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
};

export function createCategoryRuleId(prefix = "custom-rule") {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return `${prefix}-${randomId}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sortRuntimeRules(rules: EditableCategoryRuleRuntime[]) {
  return [...rules].sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority;
    return left.name.localeCompare(right.name, "ko");
  });
}

function sanitizeRuntimeRule(rule: EditableCategoryRuleRuntime, index: number, seenIds: Set<string> | null = null): EditableCategoryRuleRuntime {
  const keywords = Array.from(new Set((rule.keywords ?? []).map((keyword) => String(keyword ?? "").trim()).filter(Boolean)));
  const recommendation = rule.recommendation ?? {
    ...DEFAULT_CATEGORY_RULE_RECOMMENDATION,
    reason: getDefaultCategoryRuleReason(),
  };

  return {
    keywords,
    recommendation: {
      category1: String(recommendation.category1 ?? "").trim() || DEFAULT_CATEGORY_RULE_RECOMMENDATION.category1,
      category2: String(recommendation.category2 ?? "").trim() || DEFAULT_CATEGORY_RULE_RECOMMENDATION.category2,
      category3: String(recommendation.category3 ?? "").trim() || DEFAULT_CATEGORY_RULE_RECOMMENDATION.category3,
      reason: String(recommendation.reason ?? "").trim() || getDefaultCategoryRuleReason(),
    },
    id: (() => {
      const rawId = String(rule.id ?? "").trim();
      const nextId = rawId || createCategoryRuleId(`custom-rule-${index + 1}`);
      if (!seenIds) return nextId;
      if (!seenIds.has(nextId)) {
        seenIds.add(nextId);
        return nextId;
      }

      const uniqueId = createCategoryRuleId(`custom-rule-${index + 1}`);
      seenIds.add(uniqueId);
      return uniqueId;
    })(),
    name: String(rule.name ?? "").trim() || getRuntimeCategoryRuleName(index),
    enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
    priority: Number.isFinite(rule.priority) ? rule.priority : (index + 1) * 10,
  };
}

export function sanitizeStoredCategoryRules(rules: EditableCategoryRuleRuntime[]): EditableCategoryRuleRuntime[] {
  const seenIds = new Set<string>();
  return sortRuntimeRules(rules.map((rule, index) => sanitizeRuntimeRule(rule, index, seenIds)));
}

export function toRuntimeCategoryRules(rules: EditableCategoryRuleRuntime[]): WorkOrderCategoryKeywordRule[] {
  return sortRuntimeRules(rules)
    .filter((rule) => rule.enabled)
    .map(({ keywords, recommendation }) => ({ keywords, recommendation }));
}

export function getStoredEditableCategoryRules(): EditableCategoryRuleRuntime[] | null {
  const stored = loadPersistedCategoryRulesJson();
  if (!Array.isArray(stored)) return null;
  return sanitizeStoredCategoryRules(stored as EditableCategoryRuleRuntime[]);
}

export function getActiveWorkOrderCategoryRules(): WorkOrderCategoryKeywordRule[] {
  const storedRules = getStoredEditableCategoryRules();
  return storedRules ? toRuntimeCategoryRules(storedRules) : WORKORDER_CATEGORY_KEYWORD_RULES;
}

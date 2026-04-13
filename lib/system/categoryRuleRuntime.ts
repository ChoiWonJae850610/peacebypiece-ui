import { WORKORDER_CATEGORY_KEYWORD_RULES, type WorkOrderCategoryKeywordRule } from "@/lib/constants/workorderCategoryKeywords";

export const CATEGORY_RULE_STORAGE_KEY = "peacebypiece.system.categoryRules.v1";

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
    name: String(rule.name ?? "").trim() || `추천 규칙 ${index + 1}`,
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

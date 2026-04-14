import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { getCategoryRulesManagerText } from "@/lib/system/categoryRuleText";

export const DEFAULT_CATEGORY_RULE_RECOMMENDATION = {
  category1: "상의",
  category2: "티셔츠",
  category3: "반팔",
} as const;

export function getDefaultCategoryRuleReason(locale: Locale = DEFAULT_LOCALE) {
  return getCategoryRulesManagerText(locale).defaultReasonText;
}

export function getFallbackCategoryRuleKeyword(locale: Locale = DEFAULT_LOCALE) {
  return getCategoryRulesManagerText(locale).fallbackRuleKeyword;
}

export function getInitialCategoryRuleName(keyword: string | undefined, locale: Locale = DEFAULT_LOCALE) {
  const text = getCategoryRulesManagerText(locale);
  if (!keyword) return text.newRuleName.replace(" {count}", "").replace("{count}", "").trim();
  return `${keyword} ${text.initialRuleNameSuffix}`;
}

export function getRuntimeCategoryRuleName(index: number, locale: Locale = DEFAULT_LOCALE) {
  const text = getCategoryRulesManagerText(locale);
  return `${text.runtimeRuleName} ${index + 1}`;
}

export function getActiveCategoryRuleStatusLabel(locale: Locale = DEFAULT_LOCALE) {
  return getCategoryRulesManagerText(locale).activeStatusLabel;
}

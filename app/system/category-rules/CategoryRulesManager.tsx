"use client";

import { useEffect, useMemo, useState } from "react";
import type { EditableCategoryRule } from "@/lib/system/categoryRuleEditor";
import {
  buildCategoryRuleMatchPreview,
  createDefaultRule,
  getInitialEditableCategoryRules,
  sanitizeEditableCategoryRules,
  sortEditableCategoryRules,
} from "@/lib/system/categoryRuleEditor";
import { CATEGORY_RULE_STORAGE_KEY, getStoredEditableCategoryRules } from "@/lib/system/categoryRuleRuntime";

export type CategoryRulesManagerText = {
  addRule: string;
  deleteRule: string;
  duplicateRule: string;
  saveRules: string;
  resetRules: string;
  enabled: string;
  disabled: string;
  priorityLabel: string;
  keywordsLabel: string;
  ruleNameLabel: string;
  reasonLabel: string;
  recommendationLabel: string;
  testInputLabel: string;
  testInputPlaceholder: string;
  noRuleSelected: string;
  saveHint: string;
  savedToast: string;
  appliedHint: string;
  resetHint: string;
  selectedRuleTitle: string;
  listCountLabel: string;
  noKeywords: string;
  matchedRuleLabel: string;
  matchedKeywordsLabel: string;
  noMatch: string;
  category1Label: string;
  category2Label: string;
  category3Label: string;
};

function parseKeywordText(value: string) {
  return value
    .split(/[\n,]+/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function buildKeywordTextareaValue(keywords: string[]) {
  return keywords.join("\n");
}

export default function CategoryRulesManager({ text }: { text: CategoryRulesManagerText }) {
  const [rules, setRules] = useState<EditableCategoryRule[]>(() => getInitialEditableCategoryRules());
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState("데님 자켓 샘플");
  const [statusMessage, setStatusMessage] = useState<string>(text.saveHint);

  useEffect(() => {
    const storedRules = getStoredEditableCategoryRules();
    if (!storedRules) {
      const initial = sortEditableCategoryRules(getInitialEditableCategoryRules());
      setRules(initial);
      setSelectedRuleId(initial[0]?.id ?? null);
      return;
    }

    setRules(storedRules);
    setSelectedRuleId(storedRules[0]?.id ?? null);
  }, []);

  const sortedRules = useMemo(() => sortEditableCategoryRules(rules), [rules]);
  const selectedRule = useMemo(
    () => sortedRules.find((rule) => rule.id === selectedRuleId) ?? sortedRules[0] ?? null,
    [selectedRuleId, sortedRules],
  );

  useEffect(() => {
    if (!selectedRule && sortedRules[0]) {
      setSelectedRuleId(sortedRules[0].id);
    }
  }, [selectedRule, sortedRules]);

  const preview = useMemo(() => buildCategoryRuleMatchPreview(testTitle, sortedRules), [sortedRules, testTitle]);

  function updateRule(ruleId: string, updater: (rule: EditableCategoryRule) => EditableCategoryRule) {
    setRules((current) => current.map((rule) => (rule.id === ruleId ? updater(rule) : rule)));
  }

  function handleAddRule() {
    const nextRule = createDefaultRule(sortedRules.length);
    const nextRules = sortEditableCategoryRules([...sortedRules, nextRule]);
    setRules(nextRules);
    setSelectedRuleId(nextRule.id);
    setStatusMessage(text.saveHint);
  }

  function handleDuplicateRule() {
    if (!selectedRule) return;
    const clone: EditableCategoryRule = {
      ...selectedRule,
      id: `${selectedRule.id}-copy-${Date.now()}`,
      name: `${selectedRule.name} 복사본`,
      priority: selectedRule.priority + 1,
    };
    const nextRules = sortEditableCategoryRules([...sortedRules, clone]);
    setRules(nextRules);
    setSelectedRuleId(clone.id);
    setStatusMessage(text.saveHint);
  }

  function handleDeleteRule() {
    if (!selectedRule) return;
    const nextRules = sortedRules.filter((rule) => rule.id !== selectedRule.id);
    setRules(nextRules);
    setSelectedRuleId(nextRules[0]?.id ?? null);
    setStatusMessage(text.saveHint);
  }

  function handleSave() {
    const sanitized = sanitizeEditableCategoryRules(sortedRules);
    window.localStorage.setItem(CATEGORY_RULE_STORAGE_KEY, JSON.stringify(sanitized));
    setRules(sanitized);
    setSelectedRuleId((current) => current ?? sanitized[0]?.id ?? null);
    setStatusMessage(text.appliedHint);
  }

  function handleReset() {
    const initial = sortEditableCategoryRules(getInitialEditableCategoryRules());
    window.localStorage.removeItem(CATEGORY_RULE_STORAGE_KEY);
    setRules(initial);
    setSelectedRuleId(initial[0]?.id ?? null);
    setStatusMessage(text.resetHint);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.45fr)]">
      <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-900">{text.selectedRuleTitle}</h2>
            <p className="text-sm leading-6 text-stone-600">{text.listCountLabel.replace("{count}", String(sortedRules.length))}</p>
          </div>
          <button type="button" onClick={handleAddRule} className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
            {text.addRule}
          </button>
        </div>
        <div className="space-y-3">
          {sortedRules.map((rule) => {
            const isSelected = rule.id === selectedRule?.id;
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => setSelectedRuleId(rule.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isSelected ? "bg-white/15 text-white" : "bg-white text-stone-600"}`}>P{rule.priority}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${isSelected ? "border-white/15 text-white" : "border-stone-300 text-stone-600"}`}>
                        {rule.enabled ? text.enabled : text.disabled}
                      </span>
                    </div>
                    <div className="text-base font-semibold">{rule.name}</div>
                    <div className={`text-sm leading-6 ${isSelected ? "text-stone-200" : "text-stone-600"}`}>
                      {rule.recommendation.category1} / {rule.recommendation.category2} / {rule.recommendation.category3}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rule.keywords.length > 0 ? rule.keywords.map((keyword) => (
                    <span key={`${rule.id}-${keyword}`} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isSelected ? "bg-white/10 text-white" : "bg-white text-stone-600"}`}>
                      {keyword}
                    </span>
                  )) : <span className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{text.noKeywords}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </article>

      <div className="flex flex-col gap-6">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          {selectedRule ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleDuplicateRule} className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">{text.duplicateRule}</button>
                <button type="button" onClick={handleDeleteRule} className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100">{text.deleteRule}</button>
                <button type="button" onClick={handleSave} className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800">{text.saveRules}</button>
                <button type="button" onClick={handleReset} className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">{text.resetRules}</button>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">{statusMessage}</div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">{text.ruleNameLabel}</span>
                  <input
                    value={selectedRule.name}
                    onChange={(event) => updateRule(selectedRule.id, (rule) => ({ ...rule, name: event.target.value }))}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">{text.priorityLabel}</span>
                  <input
                    type="number"
                    value={selectedRule.priority}
                    onChange={(event) => updateRule(selectedRule.id, (rule) => ({ ...rule, priority: Number(event.target.value) }))}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRule.enabled}
                  onChange={(event) => updateRule(selectedRule.id, (rule) => ({ ...rule, enabled: event.target.checked }))}
                  className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                />
                <span className="text-sm font-medium text-stone-700">{selectedRule.enabled ? text.enabled : text.disabled}</span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">{text.keywordsLabel}</span>
                <textarea
                  value={buildKeywordTextareaValue(selectedRule.keywords)}
                  onChange={(event) => updateRule(selectedRule.id, (rule) => ({ ...rule, keywords: parseKeywordText(event.target.value) }))}
                  rows={6}
                  className="w-full rounded-3xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-500"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">{text.category1Label}</span>
                  <input
                    value={selectedRule.recommendation.category1}
                    onChange={(event) => updateRule(selectedRule.id, (rule) => ({
                      ...rule,
                      recommendation: { ...rule.recommendation, category1: event.target.value },
                    }))}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">{text.category2Label}</span>
                  <input
                    value={selectedRule.recommendation.category2}
                    onChange={(event) => updateRule(selectedRule.id, (rule) => ({
                      ...rule,
                      recommendation: { ...rule.recommendation, category2: event.target.value },
                    }))}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">{text.category3Label}</span>
                  <input
                    value={selectedRule.recommendation.category3}
                    onChange={(event) => updateRule(selectedRule.id, (rule) => ({
                      ...rule,
                      recommendation: { ...rule.recommendation, category3: event.target.value },
                    }))}
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">{text.reasonLabel}</span>
                <textarea
                  value={selectedRule.recommendation.reason}
                  onChange={(event) => updateRule(selectedRule.id, (rule) => ({
                    ...rule,
                    recommendation: { ...rule.recommendation, reason: event.target.value },
                  }))}
                  rows={4}
                  className="w-full rounded-3xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-500"
                />
              </label>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">{text.noRuleSelected}</div>
          )}
        </article>

        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-stone-900">{text.testInputLabel}</h2>
            <p className="text-sm leading-6 text-stone-600">{text.testInputPlaceholder}</p>
          </div>
          <div className="space-y-4">
            <input
              value={testTitle}
              onChange={(event) => setTestTitle(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
            />
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
              {preview.matchedRuleId ? (
                <div className="space-y-2">
                  <div><span className="font-medium text-stone-900">{text.matchedRuleLabel}:</span> {preview.matchedRuleName}</div>
                  <div><span className="font-medium text-stone-900">{text.matchedKeywordsLabel}:</span> {preview.matchedKeywords.join(", ")}</div>
                  <div><span className="font-medium text-stone-900">{text.recommendationLabel}:</span> {preview.recommendationLabel}</div>
                  <div className="text-stone-600">{preview.reason}</div>
                </div>
              ) : (
                <div className="text-stone-500">{text.noMatch}</div>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

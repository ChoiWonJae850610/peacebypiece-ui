"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import type { EditableCategoryRule } from "@/lib/system/categoryRuleEditor";
import {
  buildCategoryRuleMatchPreview,
  createDefaultRule,
  getInitialEditableCategoryRules,
  moveEditableCategoryRule,
  reassignEditableCategoryRulePriorities,
  sanitizeEditableCategoryRules,
  sortEditableCategoryRules,
} from "@/lib/system/categoryRuleEditor";
import {
  CATEGORY_RULE_STORAGE_KEY,
  createCategoryRuleId,
  getStoredEditableCategoryRules,
} from "@/lib/system/categoryRuleRuntime";

export type CategoryRulesManagerText = {
  priorityBadgeLabel: string;
  priorityHelpText: string;
  keywordsHelpText: string;
  reasonHelpText: string;
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
  moveUp: string;
  moveDown: string;
  dragHandleLabel: string;
  autoPriorityHelpText: string;
};

export type CategoryRulesManagerHandle = {
  save: () => void;
  reset: () => void;
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

const CategoryRulesManager = forwardRef<CategoryRulesManagerHandle, { text: CategoryRulesManagerText }>(
  function CategoryRulesManager({ text }, ref) {
    const [rules, setRules] = useState<EditableCategoryRule[]>(() => getInitialEditableCategoryRules());
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [testTitle, setTestTitle] = useState("데님 자켓 샘플");
    const [statusMessage, setStatusMessage] = useState<string>(text.saveHint);
    const [keywordTextByRuleId, setKeywordTextByRuleId] = useState<Record<string, string>>({});
    const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);

    useEffect(() => {
      const storedRules = getStoredEditableCategoryRules();
      if (!storedRules) {
        const initial = reassignEditableCategoryRulePriorities(sortEditableCategoryRules(getInitialEditableCategoryRules()));
        setRules(initial);
        setSelectedRuleId(initial[0]?.id ?? null);
        return;
      }

      const normalizedRules = reassignEditableCategoryRulePriorities(sortEditableCategoryRules(storedRules));
      setRules(normalizedRules);
      setSelectedRuleId(normalizedRules[0]?.id ?? null);
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

    useEffect(() => {
      setKeywordTextByRuleId((current) => {
        const next: Record<string, string> = {};
        for (const rule of sortedRules) {
          next[rule.id] = current[rule.id] ?? buildKeywordTextareaValue(rule.keywords);
        }
        return next;
      });
    }, [sortedRules]);

    function replaceRules(nextRules: EditableCategoryRule[]) {
      setRules(reassignEditableCategoryRulePriorities(nextRules));
    }

    function updateRule(ruleId: string, updater: (rule: EditableCategoryRule) => EditableCategoryRule) {
      setRules((current) =>
        current.map((rule) => (rule.id === ruleId ? updater(rule) : rule)),
      );
    }

    function handleKeywordTextChange(ruleId: string, value: string) {
      setKeywordTextByRuleId((current) => ({ ...current, [ruleId]: value }));
      updateRule(ruleId, (rule) => ({ ...rule, keywords: parseKeywordText(value) }));
    }

    function handleAddRule() {
      const nextRule = createDefaultRule(sortedRules.length);
      const nextRules = [...sortedRules, nextRule];
      replaceRules(nextRules);
      setSelectedRuleId(nextRule.id);
      setStatusMessage(text.saveHint);
    }

    function handleDuplicateRule() {
      if (!selectedRule) return;
      const sourceIndex = sortedRules.findIndex((rule) => rule.id === selectedRule.id);
      const insertIndex = sourceIndex >= 0 ? sourceIndex + 1 : sortedRules.length;
      const clone: EditableCategoryRule = {
        ...selectedRule,
        id: createCategoryRuleId(`${selectedRule.id}-copy`),
        name: `${selectedRule.name} 복사본`,
      };
      const nextRules = [...sortedRules];
      nextRules.splice(insertIndex, 0, clone);
      replaceRules(nextRules);
      setSelectedRuleId(clone.id);
      setStatusMessage(text.saveHint);
    }

    function handleDeleteRule() {
      if (!selectedRule) return;
      const nextRules = sortedRules.filter((rule) => rule.id !== selectedRule.id);
      replaceRules(nextRules);
      setSelectedRuleId(nextRules[0]?.id ?? null);
      setStatusMessage(text.saveHint);
    }

    function persistRules(nextRules: EditableCategoryRule[], nextMessage: string) {
      const sanitized = sanitizeEditableCategoryRules(reassignEditableCategoryRulePriorities(nextRules));
      window.localStorage.setItem(CATEGORY_RULE_STORAGE_KEY, JSON.stringify(sanitized));
      setRules(sanitized);
      setKeywordTextByRuleId(
        Object.fromEntries(sanitized.map((rule) => [rule.id, buildKeywordTextareaValue(rule.keywords)])),
      );
      setSelectedRuleId((current) => current ?? sanitized[0]?.id ?? null);
      setStatusMessage(nextMessage);
    }

    function handleSave() {
      persistRules(sortedRules, text.appliedHint);
    }

    function handleReset() {
      const initial = reassignEditableCategoryRulePriorities(sortEditableCategoryRules(getInitialEditableCategoryRules()));
      window.localStorage.removeItem(CATEGORY_RULE_STORAGE_KEY);
      setRules(initial);
      setKeywordTextByRuleId(
        Object.fromEntries(initial.map((rule) => [rule.id, buildKeywordTextareaValue(rule.keywords)])),
      );
      setSelectedRuleId(initial[0]?.id ?? null);
      setStatusMessage(text.resetHint);
    }

    function handleReorder(fromIndex: number, toIndex: number) {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const movedRules = moveEditableCategoryRule(sortedRules, fromIndex, toIndex);
      replaceRules(movedRules);
      persistRules(movedRules, text.appliedHint);
    }

    useImperativeHandle(
      ref,
      () => ({
        save: handleSave,
        reset: handleReset,
      }),
      [sortedRules, text.appliedHint, text.resetHint],
    );

    return (
      <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.45fr)]">
        <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-stone-900">{text.selectedRuleTitle}</h2>
              <p className="text-sm leading-6 text-stone-600">{text.listCountLabel.replace("{count}", String(sortedRules.length))}</p>
            </div>
            <button
              type="button"
              onClick={handleAddRule}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            >
              {text.addRule}
            </button>
          </div>
          <div className="space-y-3">
            {sortedRules.map((rule, index) => {
              const isSelected = rule.id === selectedRule?.id;
              const isDragging = draggingRuleId === rule.id;

              return (
                <div
                  key={rule.id}
                  draggable
                  onDragStart={() => setDraggingRuleId(rule.id)}
                  onDragEnd={() => setDraggingRuleId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    const fromIndex = sortedRules.findIndex((item) => item.id === draggingRuleId);
                    handleReorder(fromIndex, index);
                    setDraggingRuleId(null);
                  }}
                  className={`rounded-2xl border p-4 transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300"} ${isDragging ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setSelectedRuleId(rule.id)} className="min-w-0 flex-1 text-left">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isSelected ? "bg-white/15 text-white" : "bg-white text-stone-600"}`}>
                            {text.priorityBadgeLabel} P{rule.priority}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${isSelected ? "border-white/15 text-white" : "border-stone-300 text-stone-600"}`}>
                            {rule.enabled ? text.enabled : text.disabled}
                          </span>
                        </div>
                        <div className="text-base font-semibold">{rule.name}</div>
                        <div className={`text-sm leading-6 ${isSelected ? "text-stone-200" : "text-stone-600"}`}>
                          {rule.recommendation.category1} / {rule.recommendation.category2} / {rule.recommendation.category3}
                        </div>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`hidden cursor-grab select-none rounded-2xl border px-3 py-2 text-sm font-medium md:inline-flex ${isSelected ? "border-white/15 text-white" : "border-stone-300 text-stone-500"}`}
                        aria-label={text.dragHandleLabel}
                        title={text.dragHandleLabel}
                      >
                        ⋮⋮
                      </span>
                      <div className="flex items-center gap-1 md:hidden">
                        <button
                          type="button"
                          onClick={() => handleReorder(index, index - 1)}
                          disabled={index === 0}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                         title={text.moveUp} aria-label={text.moveUp}>
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(index, index + 1)}
                          disabled={index === sortedRules.length - 1}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                         title={text.moveDown} aria-label={text.moveDown}>
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {rule.keywords.length > 0 ? (
                      rule.keywords.map((keyword, keywordIndex) => (
                        <span
                          key={`${rule.id}-${keywordIndex}-${keyword}`}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isSelected ? "bg-white/10 text-white" : "bg-white text-stone-600"}`}
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{text.noKeywords}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <div className="flex flex-col gap-6">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            {selectedRule ? (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDuplicateRule}
                    className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    {text.duplicateRule}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteRule}
                    className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  >
                    {text.deleteRule}
                  </button>
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
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">{text.priorityLabel}</span>
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                      <div className="font-medium">{text.priorityBadgeLabel} P{selectedRule.priority}</div>
                      <p className="mt-1 text-xs leading-5 text-stone-500">{text.autoPriorityHelpText}</p>
                    </div>
                  </div>
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
                  <p className="text-xs leading-5 text-stone-500">{text.keywordsHelpText}</p>
                  <textarea
                    value={keywordTextByRuleId[selectedRule.id] ?? buildKeywordTextareaValue(selectedRule.keywords)}
                    onChange={(event) => handleKeywordTextChange(selectedRule.id, event.target.value)}
                    rows={6}
                    className="w-full rounded-3xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">{text.category1Label}</span>
                    <input
                      value={selectedRule.recommendation.category1}
                      onChange={(event) =>
                        updateRule(selectedRule.id, (rule) => ({
                          ...rule,
                          recommendation: { ...rule.recommendation, category1: event.target.value },
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">{text.category2Label}</span>
                    <input
                      value={selectedRule.recommendation.category2}
                      onChange={(event) =>
                        updateRule(selectedRule.id, (rule) => ({
                          ...rule,
                          recommendation: { ...rule.recommendation, category2: event.target.value },
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">{text.category3Label}</span>
                    <input
                      value={selectedRule.recommendation.category3}
                      onChange={(event) =>
                        updateRule(selectedRule.id, (rule) => ({
                          ...rule,
                          recommendation: { ...rule.recommendation, category3: event.target.value },
                        }))
                      }
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">{text.reasonLabel}</span>
                  <p className="text-xs leading-5 text-stone-500">{text.reasonHelpText}</p>
                  <textarea
                    value={selectedRule.recommendation.reason}
                    onChange={(event) =>
                      updateRule(selectedRule.id, (rule) => ({
                        ...rule,
                        recommendation: { ...rule.recommendation, reason: event.target.value },
                      }))
                    }
                    rows={4}
                    className="w-full rounded-3xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
                {text.noRuleSelected}
              </div>
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
                    <div>
                      <span className="font-medium text-stone-900">{text.matchedRuleLabel}:</span> {preview.matchedRuleName}
                    </div>
                    <div>
                      <span className="font-medium text-stone-900">{text.matchedKeywordsLabel}:</span> {preview.matchedKeywords.join(", ")}
                    </div>
                    <div>
                      <span className="font-medium text-stone-900">{text.recommendationLabel}:</span> {preview.recommendationLabel}
                    </div>
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
  },
);

export default CategoryRulesManager;

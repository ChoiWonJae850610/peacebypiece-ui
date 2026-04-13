"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
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
  openList: string;
  openTest: string;
  close: string;
  mobileListTitle: string;
  mobileListSubtitle: string;
  mobileSearchPlaceholder: string;
  testModalTitle: string;
  testModalDescription: string;
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

type MobileListDrawerProps = {
  open: boolean;
  onClose: () => void;
  rules: EditableCategoryRule[];
  selectedRuleId: string | null;
  onSelect: (ruleId: string) => void;
  onAddRule: () => void;
  onMoveUp: (ruleId: string) => void;
  onMoveDown: (ruleId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  text: CategoryRulesManagerText;
};

function MobileCategoryRuleDrawer({
  open,
  onClose,
  rules,
  selectedRuleId,
  onSelect,
  onAddRule,
  onMoveUp,
  onMoveDown,
  searchQuery,
  onSearchQueryChange,
  text,
}: MobileListDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useModalEnvironment({ open, dialogRef: drawerRef, onClose });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" aria-modal="true" role="dialog" aria-labelledby="category-rule-mobile-drawer-title">
      <button type="button" aria-label={text.close} className="absolute inset-0 bg-stone-950/45 pbp-overlay-enter" onClick={onClose} />
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-hidden rounded-r-3xl bg-white shadow-2xl focus:outline-none pbp-drawer-enter"
      >
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-3 pb-2.5 pt-[max(env(safe-area-inset-top),0.875rem)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div id="category-rule-mobile-drawer-title" className="text-sm font-semibold leading-5 text-stone-900">{text.mobileListTitle}</div>
              <div className="text-[11px] text-stone-500">{text.mobileListSubtitle}</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="pbp-touch-target pbp-interactive-button inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              {text.close}
            </button>
          </div>
          <label className="mt-3 block">
            <span className="sr-only">{text.mobileSearchPlaceholder}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={text.mobileSearchPlaceholder}
              className="pbp-field-interaction h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-500 focus:bg-stone-50"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              onAddRule();
              onClose();
            }}
            className="pbp-touch-target pbp-interactive-button mt-3 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-medium text-white hover:bg-stone-800 active:bg-black"
          >
            {text.addRule}
          </button>
        </div>
        <div className="pbp-mobile-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.875rem)]">
          <div className="flex flex-col gap-3">
            {rules.map((rule, index) => {
              const isSelected = rule.id === selectedRuleId;
              return (
                <div
                  key={rule.id}
                  className={[
                    "rounded-3xl border px-4 py-4 shadow-sm transition",
                    isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-900",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(rule.id);
                      onClose();
                    }}
                    className="block w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="truncate text-sm font-semibold">{rule.name}</div>
                        <div className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>
                          {rule.enabled ? text.enabled : text.disabled}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rule.keywords.length > 0 ? (
                        rule.keywords.map((keyword, keywordIndex) => (
                          <span
                            key={`${rule.id}-${keywordIndex}-${keyword}`}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isSelected ? "bg-white/10 text-white" : "bg-stone-100 text-stone-600"}`}
                          >
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{text.noKeywords}</span>
                      )}
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onMoveUp(rule.id)}
                      disabled={index === 0}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 bg-white text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveDown(rule.id)}
                      disabled={index === rules.length - 1}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-300 bg-white text-sm text-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

type TestModalProps = {
  open: boolean;
  onClose: () => void;
  testTitle: string;
  onChangeTitle: (value: string) => void;
  preview: ReturnType<typeof buildCategoryRuleMatchPreview>;
  text: CategoryRulesManagerText;
};

function CategoryRuleTestModal({ open, onClose, testTitle, onChangeTitle, preview, text }: TestModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={text.testModalTitle}
      description={text.testModalDescription}
      maxWidthClass="md:max-w-xl"
    >
      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-stone-700">{text.testInputLabel}</span>
          <input
            value={testTitle}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder={text.testInputPlaceholder}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
          />
        </label>
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
    </ModalShell>
  );
}

const CategoryRulesManager = forwardRef<CategoryRulesManagerHandle, { text: CategoryRulesManagerText }>(
  function CategoryRulesManager({ text }, ref) {
    const [rules, setRules] = useState<EditableCategoryRule[]>(() => getInitialEditableCategoryRules());
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [testTitle, setTestTitle] = useState("데님 자켓 샘플");
    const [keywordTextByRuleId, setKeywordTextByRuleId] = useState<Record<string, string>>({});
    const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
    const [mobileListOpen, setMobileListOpen] = useState(false);
    const [mobileTestOpen, setMobileTestOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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
    const filteredRules = useMemo(() => {
      const normalized = searchQuery.trim().toLowerCase();
      if (!normalized) return sortedRules;
      return sortedRules.filter((rule) => {
        const haystack = [
          rule.name,
          ...rule.keywords,
          rule.recommendation.category1,
          rule.recommendation.category2,
          rule.recommendation.category3,
          rule.recommendation.reason,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      });
    }, [searchQuery, sortedRules]);

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
    }

    function handleDeleteRule() {
      if (!selectedRule) return;
      const nextRules = sortedRules.filter((rule) => rule.id !== selectedRule.id);
      replaceRules(nextRules);
      setSelectedRuleId(nextRules[0]?.id ?? null);
    }

    function persistRules(nextRules: EditableCategoryRule[]) {
      const sanitized = sanitizeEditableCategoryRules(reassignEditableCategoryRulePriorities(nextRules));
      window.localStorage.setItem(CATEGORY_RULE_STORAGE_KEY, JSON.stringify(sanitized));
      setRules(sanitized);
      setKeywordTextByRuleId(
        Object.fromEntries(sanitized.map((rule) => [rule.id, buildKeywordTextareaValue(rule.keywords)])),
      );
      setSelectedRuleId((current) => current ?? sanitized[0]?.id ?? null);
    }

    function handleSave() {
      persistRules(sortedRules);
    }

    function handleReset() {
      const initial = reassignEditableCategoryRulePriorities(sortEditableCategoryRules(getInitialEditableCategoryRules()));
      window.localStorage.removeItem(CATEGORY_RULE_STORAGE_KEY);
      setRules(initial);
      setKeywordTextByRuleId(
        Object.fromEntries(initial.map((rule) => [rule.id, buildKeywordTextareaValue(rule.keywords)])),
      );
      setSelectedRuleId(initial[0]?.id ?? null);
    }

    function handleReorder(fromIndex: number, toIndex: number) {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const movedRules = moveEditableCategoryRule(sortedRules, fromIndex, toIndex);
      replaceRules(movedRules);
      persistRules(movedRules);
    }

    function handleMoveById(ruleId: string, direction: "up" | "down") {
      const currentIndex = sortedRules.findIndex((rule) => rule.id === ruleId);
      if (currentIndex < 0) return;
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      handleReorder(currentIndex, targetIndex);
    }

    useImperativeHandle(
      ref,
      () => ({
        save: handleSave,
        reset: handleReset,
      }),
      [sortedRules],
    );

    return (
      <>
        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
          <article className="hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:block">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-stone-900">{text.selectedRuleTitle}</h2>
                <p className="text-sm text-stone-500">{text.listCountLabel.replace("{count}", String(filteredRules.length))}</p>
              </div>
              <button
                type="button"
                onClick={handleAddRule}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                {text.addRule}
              </button>
            </div>
            <label className="mb-4 block">
              <span className="sr-only">{text.mobileSearchPlaceholder}</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={text.mobileSearchPlaceholder}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
              />
            </label>
            <div className="flex max-h-[calc(100vh-18rem)] flex-col gap-3 overflow-y-auto pr-1">
              {filteredRules.map((rule, index) => {
                const isSelected = rule.id === selectedRule?.id;
                return (
                  <div
                    key={rule.id}
                    draggable
                    onDragStart={() => setDraggingRuleId(rule.id)}
                    onDragEnd={() => setDraggingRuleId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggingRuleId) return;
                      const fromIndex = sortedRules.findIndex((entry) => entry.id === draggingRuleId);
                      const toIndex = sortedRules.findIndex((entry) => entry.id === rule.id);
                      handleReorder(fromIndex, toIndex);
                      setDraggingRuleId(null);
                    }}
                    className={[
                      "rounded-3xl border px-4 py-4 shadow-sm transition",
                      isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300 hover:bg-white",
                      draggingRuleId === rule.id ? "opacity-60" : "opacity-100",
                    ].join(" ")}
                  >
                    <button type="button" onClick={() => setSelectedRuleId(rule.id)} className="block w-full text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="truncate text-sm font-semibold">{rule.name}</div>
                          <div className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>
                            {rule.enabled ? text.enabled : text.disabled}
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs ${isSelected ? "text-stone-200" : "text-stone-400"}`}>⋮⋮</span>
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
                    </button>
                  </div>
                );
              })}
            </div>
          </article>

          <div className="flex flex-col gap-6">
            <div className="flex gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setMobileListOpen(true)}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700"
              >
                {text.openList}
              </button>
              <button
                type="button"
                onClick={() => setMobileTestOpen(true)}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-medium text-white"
              >
                {text.openTest}
              </button>
            </div>

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
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">{text.ruleNameLabel}</span>
                    <input
                      value={selectedRule.name}
                      onChange={(event) => updateRule(selectedRule.id, (rule) => ({ ...rule, name: event.target.value }))}
                      className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                    />
                  </label>

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
          </div>

          <article className="hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm xl:block">
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
        </section>

        <MobileCategoryRuleDrawer
          open={mobileListOpen}
          onClose={() => setMobileListOpen(false)}
          rules={filteredRules}
          selectedRuleId={selectedRule?.id ?? null}
          onSelect={setSelectedRuleId}
          onAddRule={handleAddRule}
          onMoveUp={(ruleId) => handleMoveById(ruleId, "up")}
          onMoveDown={(ruleId) => handleMoveById(ruleId, "down")}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          text={text}
        />

        <CategoryRuleTestModal
          open={mobileTestOpen}
          onClose={() => setMobileTestOpen(false)}
          testTitle={testTitle}
          onChangeTitle={setTestTitle}
          preview={preview}
          text={text}
        />
      </>
    );
  },
);

export default CategoryRulesManager;

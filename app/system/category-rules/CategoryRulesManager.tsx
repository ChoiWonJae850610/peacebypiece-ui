"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { EditableCategoryRule } from "@/lib/system/categoryRuleEditor";
import {
  buildCategoryRuleMatchPreview,
  buildTaggedKeywordInput,
  createDefaultRule,
  getInitialEditableCategoryRules,
  moveEditableCategoryRule,
  parseTaggedKeywords,
  reassignEditableCategoryRulePriorities,
  sanitizeEditableCategoryRules,
  sortEditableCategoryRules,
} from "@/lib/system/categoryRuleEditor";
import {
  CategoryRuleEditorPanel,
  CategoryRuleListPanel,
  CategoryRuleTestModal,
  CategoryValuesModal,
  MobileCategoryRuleDrawer,
} from "@/components/system/category-rules/CategoryRulePanels";
import { createCategoryRuleId } from "@/lib/system/categoryRuleRuntime";
import {
  type CategoryTreeRuntime,
  getCategory1Options,
  getCategory2Options,
  getCategory3Options,
  getDefaultCategoryTree,
  getRuntimeCategoryTree,
  normalizeRecommendationWithTree,
  persistCategoryTree,
  removeStoredCategoryTree,
} from "@/lib/system/categoryTreeRuntime";
import {
  loadPersistedCategorySystemJson,
  persistCategoryRules,
  removePersistedCategoryRules,
} from "@/lib/system/categoryPersistence";
import { filterEditableCategoryRules } from "@/lib/system/categoryRuleView";
import type { CategoryRulesManagerText } from "@/lib/system/categoryRuleText";

export type CategoryRulesManagerHandle = {
  save: () => void;
  reset: () => void;
  openCategoryValues: () => void;
};

const CategoryRulesManager = forwardRef<CategoryRulesManagerHandle, { text: CategoryRulesManagerText }>(
  function CategoryRulesManager({ text }, ref) {
    const [rules, setRules] = useState<EditableCategoryRule[]>(() => getInitialEditableCategoryRules());
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
    const [testTitle, setTestTitle] = useState("");
    const [keywordTextByRuleId, setKeywordTextByRuleId] = useState<Record<string, string>>({});
    const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
    const [dragOverRuleId, setDragOverRuleId] = useState<string | null>(null);
    const [mobileListOpen, setMobileListOpen] = useState(false);
    const [mobileTestOpen, setMobileTestOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryTree, setCategoryTree] = useState<CategoryTreeRuntime>(() => getDefaultCategoryTree());
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const ruleNameInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      const persistedState = loadPersistedCategorySystemJson();
      const runtimeTree = getRuntimeCategoryTree();
      const storedRules = Array.isArray(persistedState.rules) ? sanitizeEditableCategoryRules(persistedState.rules as EditableCategoryRule[]) : null;
      const sourceRules = storedRules
        ? reassignEditableCategoryRulePriorities(sortEditableCategoryRules(storedRules))
        : reassignEditableCategoryRulePriorities(sortEditableCategoryRules(getInitialEditableCategoryRules()));
      const normalizedRules = sourceRules.map((rule) => ({
        ...rule,
        recommendation: normalizeRecommendationWithTree(rule.recommendation, runtimeTree),
      }));
      setRules(normalizedRules);
      setSelectedRuleId(normalizedRules[0]?.id ?? null);
      setKeywordTextByRuleId(Object.fromEntries(normalizedRules.map((rule) => [rule.id, buildTaggedKeywordInput(rule.keywords)])));
      setCategoryTree(runtimeTree);
    }, []);

    const sortedRules = useMemo(() => sortEditableCategoryRules(rules), [rules]);
    const filteredRules = useMemo(() => filterEditableCategoryRules(sortedRules, searchQuery), [searchQuery, sortedRules]);

    const selectedRule = useMemo(() => sortedRules.find((rule) => rule.id === selectedRuleId) ?? sortedRules[0] ?? null, [selectedRuleId, sortedRules]);
    const preview = useMemo(() => buildCategoryRuleMatchPreview(testTitle, sortedRules), [sortedRules, testTitle]);

    useEffect(() => {
      if (!selectedRule && sortedRules[0]) {
        setSelectedRuleId(sortedRules[0].id);
      }
    }, [selectedRule, sortedRules]);

    function syncKeywordDrafts(nextRules: EditableCategoryRule[]) {
      setKeywordTextByRuleId(Object.fromEntries(nextRules.map((rule) => [rule.id, buildTaggedKeywordInput(rule.keywords)])));
    }

    function replaceRules(nextRules: EditableCategoryRule[]) {
      setRules(reassignEditableCategoryRulePriorities(nextRules));
    }

    function persistRulesState(nextRules: EditableCategoryRule[]) {
      const sanitized = sanitizeEditableCategoryRules(reassignEditableCategoryRulePriorities(nextRules));
      persistCategoryRules(sanitized);
      setRules(sanitized);
      syncKeywordDrafts(sanitized);
      setSelectedRuleId((current) => current ?? sanitized[0]?.id ?? null);
    }

    function updateRule(ruleId: string, updater: (rule: EditableCategoryRule) => EditableCategoryRule) {
      setRules((current) => current.map((rule) => (rule.id === ruleId ? updater(rule) : rule)));
    }

    function handleKeywordTextChange(ruleId: string, value: string) {
      setKeywordTextByRuleId((current) => ({ ...current, [ruleId]: value }));
      updateRule(ruleId, (rule) => ({ ...rule, keywords: parseTaggedKeywords(value) }));
    }

    function handleAddRule() {
      const nextRule = normalizeRuleWithTree(createDefaultRule(sortedRules.length), categoryTree);
      const nextRules = [...sortedRules, nextRule];
      replaceRules(nextRules);
      setSelectedRuleId(nextRule.id);
      setMobileListOpen(false);
      focusRuleTop();
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

    function handleSave() {
      persistRulesState(sortedRules.map((rule) => normalizeRuleWithTree(rule, categoryTree)));
    }

    function handleReset() {
      const initial = reassignEditableCategoryRulePriorities(sortEditableCategoryRules(getInitialEditableCategoryRules())).map((rule) => normalizeRuleWithTree(rule, getRuntimeCategoryTree()));
      removePersistedCategoryRules();
      setRules(initial);
      syncKeywordDrafts(initial);
      setSelectedRuleId(initial[0]?.id ?? null);
    }

    function handleReorder(fromIndex: number, toIndex: number) {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const movedRules = moveEditableCategoryRule(sortedRules, fromIndex, toIndex);
      replaceRules(movedRules);
      persistRulesState(movedRules);
    }

    function handleMoveById(ruleId: string, direction: "up" | "down") {
      const currentIndex = sortedRules.findIndex((rule) => rule.id === ruleId);
      if (currentIndex < 0) return;
      handleReorder(currentIndex, direction === "up" ? currentIndex - 1 : currentIndex + 1);
    }

    const focusRuleTop = useCallback(() => {
      requestAnimationFrame(() => {
        ruleNameInputRef.current?.focus();
        ruleNameInputRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }, []);

    function handleSelectRule(ruleId: string) {
      setSelectedRuleId(ruleId);
      setMobileListOpen(false);
      focusRuleTop();
    }

    function saveCategoryTree() {
      persistCategoryTree(categoryTree);
      const normalizedRules = sortedRules.map((rule) => normalizeRuleWithTree(rule, categoryTree));
      persistRulesState(normalizedRules);
      setCategoryModalOpen(false);
    }

    function resetCategoryTree() {
      removeStoredCategoryTree();
      const defaults = getRuntimeCategoryTree();
      setCategoryTree(defaults);
    }

    useImperativeHandle(ref, () => ({ save: handleSave, reset: handleReset, openCategoryValues: () => setCategoryModalOpen(true) }), [sortedRules, categoryTree]);

    const category1Options = getCategory1Options(categoryTree);
    const currentCategory1 = selectedRule ? normalizeRuleWithTree(selectedRule, categoryTree).recommendation.category1 : category1Options[0] ?? "";
    const category2Options = getCategory2Options(categoryTree, currentCategory1);
    const currentCategory2 = selectedRule ? normalizeRuleWithTree(selectedRule, categoryTree).recommendation.category2 : category2Options[0] ?? "";
    const category3Options = getCategory3Options(categoryTree, currentCategory1, currentCategory2);

    return (
      <>
        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <CategoryRuleListPanel
            filteredRules={filteredRules}
            selectedRuleId={selectedRule?.id ?? null}
            draggingRuleId={draggingRuleId}
            dragOverRuleId={dragOverRuleId}
            onSelectRule={handleSelectRule}
            onAddRule={handleAddRule}
            onSearchQueryChange={setSearchQuery}
            searchQuery={searchQuery}
            onDragStart={(ruleId) => {
              setDraggingRuleId(ruleId);
              setDragOverRuleId(ruleId);
            }}
            onDragEnd={() => {
              setDraggingRuleId(null);
              setDragOverRuleId(null);
            }}
            onDragOver={(ruleId) => {
              if (dragOverRuleId !== ruleId) setDragOverRuleId(ruleId);
            }}
            onDrop={(ruleId) => {
              if (!draggingRuleId) return;
              handleReorder(sortedRules.findIndex((entry) => entry.id === draggingRuleId), sortedRules.findIndex((entry) => entry.id === ruleId));
              setDraggingRuleId(null);
              setDragOverRuleId(null);
            }}
            text={text}
          />

          <div className="flex flex-col gap-6">
            <div className="flex gap-2 md:hidden">
              <button type="button" onClick={() => setMobileListOpen(true)} className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700">{text.openList}</button>
              <button type="button" onClick={() => setMobileTestOpen(true)} className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-medium text-white">{text.openTest}</button>
            </div>

            <CategoryRuleEditorPanel
              selectedRule={selectedRule}
              keywordText={selectedRule ? (keywordTextByRuleId[selectedRule.id] ?? buildTaggedKeywordInput(selectedRule.keywords)) : ""}
              onDuplicateRule={handleDuplicateRule}
              onDeleteRule={handleDeleteRule}
              onUpdateName={(value) => {
                if (!selectedRule) return;
                updateRule(selectedRule.id, (rule) => ({ ...rule, name: value }));
              }}
              onUpdateEnabled={(value) => {
                if (!selectedRule) return;
                updateRule(selectedRule.id, (rule) => ({ ...rule, enabled: value }));
              }}
              onKeywordTextChange={(value) => {
                if (!selectedRule) return;
                handleKeywordTextChange(selectedRule.id, value);
              }}
              category1Options={category1Options}
              category2Options={category2Options}
              category3Options={category3Options}
              currentCategory1={currentCategory1}
              currentCategory2={currentCategory2}
              currentCategory3={selectedRule ? normalizeRuleWithTree(selectedRule, categoryTree).recommendation.category3 : (category3Options[0] ?? "")}
              onChangeCategory1={(value) => {
                if (!selectedRule) return;
                updateRule(selectedRule.id, (rule) => ({
                  ...rule,
                  recommendation: normalizeRecommendationWithTree({ ...rule.recommendation, category1: value }, categoryTree),
                }));
              }}
              onChangeCategory2={(value) => {
                if (!selectedRule) return;
                updateRule(selectedRule.id, (rule) => ({
                  ...rule,
                  recommendation: normalizeRecommendationWithTree({ ...rule.recommendation, category1: currentCategory1, category2: value }, categoryTree),
                }));
              }}
              onChangeCategory3={(value) => {
                if (!selectedRule) return;
                updateRule(selectedRule.id, (rule) => ({
                  ...rule,
                  recommendation: { ...normalizeRuleWithTree(rule, categoryTree).recommendation, category3: value },
                }));
              }}
              onChangeReason={(value) => {
                if (!selectedRule) return;
                updateRule(selectedRule.id, (rule) => ({ ...rule, recommendation: { ...rule.recommendation, reason: value } }));
              }}
              testTitle={testTitle}
              onChangeTestTitle={setTestTitle}
              preview={preview}
              text={text}
              ruleNameInputRef={ruleNameInputRef}
            />
          </div>
        </section>

        <MobileCategoryRuleDrawer
          open={mobileListOpen}
          onClose={() => setMobileListOpen(false)}
          rules={filteredRules}
          selectedRuleId={selectedRule?.id ?? null}
          onSelect={handleSelectRule}
          onAddRule={handleAddRule}
          onMoveUp={(ruleId) => handleMoveById(ruleId, "up")}
          onMoveDown={(ruleId) => handleMoveById(ruleId, "down")}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          text={text}
        />

        <CategoryRuleTestModal open={mobileTestOpen} onClose={() => setMobileTestOpen(false)} testTitle={testTitle} onChangeTitle={setTestTitle} preview={preview} text={text} />

        <CategoryValuesModal
          open={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          tree={categoryTree}
          onChangeTree={setCategoryTree}
          onSave={saveCategoryTree}
          onReset={resetCategoryTree}
          text={text}
        />
      </>
    );
  },
);

function normalizeRuleWithTree(rule: EditableCategoryRule, tree: CategoryTreeRuntime): EditableCategoryRule {
  return {
    ...rule,
    recommendation: normalizeRecommendationWithTree(rule.recommendation, tree),
  };
}

export default CategoryRulesManager;

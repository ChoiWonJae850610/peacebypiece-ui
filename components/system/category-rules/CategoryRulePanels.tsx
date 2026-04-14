"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_INPUT_CLASS, MODAL_SELECT_CLASS, MODAL_TEXTAREA_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { EditableCategoryRule } from "@/lib/system/categoryRuleEditor";
import { buildCategoryRuleMatchPreview, buildTaggedKeywordInput } from "@/lib/system/categoryRuleEditor";
import type { CategoryTreeRuntime } from "@/lib/system/categoryTreeRuntime";
import { getCategory1Options, getCategory2Options, getCategory3Options } from "@/lib/system/categoryTreeRuntime";
import type { CategoryRulesManagerText } from "@/lib/system/categoryRuleText";

function HomeChevronButton({
  direction,
  onClick,
  disabled,
  tone = "light",
  label,
}: {
  direction: "up" | "down";
  onClick: () => void;
  disabled?: boolean;
  tone?: "light" | "dark";
  label: string;
}) {
  const toneClass =
    tone === "dark"
      ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
      : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300 hover:bg-stone-100";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${toneClass} disabled:cursor-not-allowed disabled:opacity-35`}
    >
      <span className={`block transition-transform ${direction === "up" ? "rotate-180" : "rotate-0"}`}>▾</span>
    </button>
  );
}

function FooterIconButton({
  label,
  onClick,
  tone = "secondary",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "secondary" | "primary";
  children: ReactNode;
}) {
  const toneClass = tone === "primary"
    ? "border-stone-900 bg-stone-900 text-white hover:bg-stone-800"
    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${toneClass}`}
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  );
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v5h5" />
      <path d="M20 12a8 8 0 1 1-2.35-5.65L20 9" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h8V4" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

type CategoryValueRowProps = {
  value: string;
  selected: boolean;
  onSelect: () => void;
  onCommit: (nextValue: string) => void;
  onRemove: () => void;
  deleteLabel: string;
};

function CategoryValueRow({ value, selected, onSelect, onCommit, onRemove, deleteLabel }: CategoryValueRowProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = useCallback(() => {
    onCommit(draft);
  }, [draft, onCommit]);

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 rounded-2xl border p-2 transition ${selected ? "border-stone-900 bg-white shadow-sm ring-1 ring-stone-900/10" : "border-transparent bg-white/60 hover:border-stone-200 hover:bg-white"}`}
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => {
          commit();
          event.currentTarget.blur();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onFocus={onSelect}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          commit();
          event.currentTarget.blur();
        }}
        className={`${MODAL_INPUT_CLASS} h-10`}
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-lg font-semibold text-red-700"
        aria-label={deleteLabel}
        title={deleteLabel}
      >
        -
      </button>
    </div>
  );
}

export function TestResultPanel({
  preview,
  text,
}: {
  preview: ReturnType<typeof buildCategoryRuleMatchPreview>;
  text: CategoryRulesManagerText;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
      {preview.matchedRuleId ? (
        <div className="space-y-2">
          <div>
            <span className="font-medium text-stone-900">{text.matchedRuleLabel}:</span> {preview.matchedRuleName}
          </div>
          <div>
            <span className="font-medium text-stone-900">{text.matchedKeywordsLabel}:</span> {preview.matchedKeywords.map((keyword) => `#${keyword}`).join(" ")}
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
  );
}

export function CategoryRuleTestModal({
  open,
  onClose,
  testTitle,
  onChangeTitle,
  preview,
  text,
}: {
  open: boolean;
  onClose: () => void;
  testTitle: string;
  onChangeTitle: (value: string) => void;
  preview: ReturnType<typeof buildCategoryRuleMatchPreview>;
  text: CategoryRulesManagerText;
}) {
  return (
    <ModalShell open={open} onClose={onClose} title={text.testModalTitle} maxWidthClass="md:max-w-xl">
      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium text-stone-700">{text.testInputLabel}</span>
          <input
            value={testTitle}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder={text.testInputPlaceholder}
            className={MODAL_INPUT_CLASS}
          />
        </label>
        <TestResultPanel preview={preview} text={text} />
      </div>
    </ModalShell>
  );
}

export function MobileCategoryRuleDrawer({
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
}: {
  open: boolean;
  rules: EditableCategoryRule[];
  onClose: () => void;
  selectedRuleId: string | null;
  onSelect: (ruleId: string) => void;
  onAddRule: () => void;
  onMoveUp: (ruleId: string) => void;
  onMoveDown: (ruleId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  text: CategoryRulesManagerText;
}) {
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
            <div id="category-rule-mobile-drawer-title" className="text-sm font-semibold leading-5 text-stone-900">{text.mobileListTitle}</div>
            <button type="button" onClick={onClose} className="pbp-touch-target inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700">
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
              className={MODAL_INPUT_CLASS}
            />
          </label>
          <button type="button" onClick={onAddRule} className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-stone-900 bg-stone-900 px-3.5 text-sm font-semibold text-white">
            {text.addRule}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-3 pb-4">
            {rules.map((rule, index) => {
              const isSelected = selectedRuleId === rule.id;
              return (
                <div key={rule.id} className={`rounded-3xl border px-4 py-4 shadow-sm ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-900"}`}>
                  <button type="button" onClick={() => onSelect(rule.id)} className="block w-full text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="truncate text-sm font-semibold">{rule.name}</div>
                        <div className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{rule.enabled ? text.enabled : text.disabled}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rule.keywords.length > 0 ? rule.keywords.map((keyword, keywordIndex) => (
                        <span key={`${rule.id}-${keywordIndex}-${keyword}`} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isSelected ? "bg-white/10 text-white" : "bg-white text-stone-600"}`}>#{keyword}</span>
                      )) : <span className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{text.noKeywords}</span>}
                    </div>
                  </button>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <HomeChevronButton direction="up" onClick={() => onMoveUp(rule.id)} disabled={index === 0} tone={isSelected ? "dark" : "light"} label={text.moveUp} />
                    <HomeChevronButton direction="down" onClick={() => onMoveDown(rule.id)} disabled={index === rules.length - 1} tone={isSelected ? "dark" : "light"} label={text.moveDown} />
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

function normalizeTreeSelection(tree: CategoryTreeRuntime, currentCategory1: string | null, currentCategory2: string | null) {
  const category1 = getCategory1Options(tree)[0] ?? "";
  const nextCategory1 = currentCategory1 && tree[currentCategory1] ? currentCategory1 : category1;
  const category2 = getCategory2Options(tree, nextCategory1)[0] ?? "";
  const nextCategory2 = currentCategory2 && tree[nextCategory1]?.[currentCategory2] ? currentCategory2 : category2;
  return { category1: nextCategory1, category2: nextCategory2 };
}

export function CategoryValuesModal({
  open,
  onClose,
  tree,
  onChangeTree,
  onSave,
  onReset,
  text,
}: {
  open: boolean;
  onClose: () => void;
  tree: CategoryTreeRuntime;
  onChangeTree: (nextTree: CategoryTreeRuntime) => void;
  onSave: () => void;
  onReset: () => void;
  text: CategoryRulesManagerText;
}) {
  const [selectedCategory1, setSelectedCategory1] = useState<string | null>(null);
  const [selectedCategory2, setSelectedCategory2] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const normalized = normalizeTreeSelection(tree, selectedCategory1, selectedCategory2);
    if (normalized.category1 !== selectedCategory1) setSelectedCategory1(normalized.category1);
    if (normalized.category2 !== selectedCategory2) setSelectedCategory2(normalized.category2);
  }, [open, tree, selectedCategory1, selectedCategory2]);

  const category1Options = getCategory1Options(tree);
  const activeCategory1 = selectedCategory1 && tree[selectedCategory1] ? selectedCategory1 : category1Options[0] ?? "";
  const category2Options = getCategory2Options(tree, activeCategory1);
  const activeCategory2 = selectedCategory2 && tree[activeCategory1]?.[selectedCategory2] ? selectedCategory2 : category2Options[0] ?? "";
  const category3Options = getCategory3Options(tree, activeCategory1, activeCategory2);

  function renameCategory1(source: string, nextValue: string) {
    const trimmed = nextValue.trim();
    if (!trimmed || trimmed === source) return;
    const nextTree = Object.fromEntries(Object.entries(tree).map(([key, value]) => [key === source ? trimmed : key, value]));
    onChangeTree(nextTree);
    setSelectedCategory1(trimmed);
  }

  function renameCategory2(source: string, nextValue: string) {
    const trimmed = nextValue.trim();
    if (!trimmed || trimmed === source) return;
    const nextTree = {
      ...tree,
      [activeCategory1]: Object.fromEntries(Object.entries(tree[activeCategory1] ?? {}).map(([key, value]) => [key === source ? trimmed : key, value])),
    };
    onChangeTree(nextTree);
    setSelectedCategory2(trimmed);
  }

  function renameCategory3(source: string, nextValue: string) {
    const trimmed = nextValue.trim();
    if (!trimmed || trimmed === source) return;
    const nextTree = {
      ...tree,
      [activeCategory1]: {
        ...(tree[activeCategory1] ?? {}),
        [activeCategory2]: (tree[activeCategory1]?.[activeCategory2] ?? []).map((item) => (item === source ? trimmed : item)),
      },
    };
    onChangeTree(nextTree);
  }

  function addCategory1() {
    const newName = `새 대분류 ${category1Options.length + 1}`;
    onChangeTree({ ...tree, [newName]: { "새 중분류": ["새 소분류"] } });
    setSelectedCategory1(newName);
    setSelectedCategory2("새 중분류");
  }

  function addCategory2() {
    if (!activeCategory1) return;
    const newName = `새 중분류 ${category2Options.length + 1}`;
    onChangeTree({ ...tree, [activeCategory1]: { ...(tree[activeCategory1] ?? {}), [newName]: ["새 소분류"] } });
    setSelectedCategory2(newName);
  }

  function addCategory3() {
    if (!activeCategory1 || !activeCategory2) return;
    const newName = `새 소분류 ${category3Options.length + 1}`;
    onChangeTree({
      ...tree,
      [activeCategory1]: {
        ...(tree[activeCategory1] ?? {}),
        [activeCategory2]: [...(tree[activeCategory1]?.[activeCategory2] ?? []), newName],
      },
    });
  }

  function removeCategory1(category1: string) {
    const entries = Object.entries(tree).filter(([key]) => key !== category1);
    if (entries.length === 0) return;
    onChangeTree(Object.fromEntries(entries));
    setSelectedCategory1(entries[0][0]);
    setSelectedCategory2(Object.keys(entries[0][1])[0] ?? null);
  }

  function removeCategory2(category2: string) {
    const currentMap = tree[activeCategory1] ?? {};
    const entries = Object.entries(currentMap).filter(([key]) => key !== category2);
    if (entries.length === 0) return;
    onChangeTree({ ...tree, [activeCategory1]: Object.fromEntries(entries) });
    setSelectedCategory2(entries[0][0]);
  }

  function removeCategory3(category3: string) {
    const nextList = (tree[activeCategory1]?.[activeCategory2] ?? []).filter((item) => item !== category3);
    if (nextList.length === 0) return;
    onChangeTree({
      ...tree,
      [activeCategory1]: {
        ...(tree[activeCategory1] ?? {}),
        [activeCategory2]: nextList,
      },
    });
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={text.categoryValuesModalTitle}
      maxWidthClass="md:max-w-4xl"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <FooterIconButton onClick={onReset} label={text.categoryValuesReset}>
            <ResetIcon />
          </FooterIconButton>
          <FooterIconButton onClick={onSave} label={text.categoryValuesSave} tone="primary">
            <SaveIcon />
          </FooterIconButton>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-stone-300 bg-stone-50/90 p-4 shadow-sm ring-1 ring-white/60">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">{text.category1Label}</div>
              <div className="text-xs text-stone-500">선택한 대분류를 기준으로 다음 단계가 연결됩니다.</div>
            </div>
            <button type="button" onClick={addCategory1} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-medium text-stone-700">+</button>
          </div>
          <div className="space-y-2">
            {category1Options.map((category1) => (
              <CategoryValueRow
                key={category1}
                value={category1}
                selected={activeCategory1 === category1}
                onSelect={() => {
                  setSelectedCategory1(category1);
                  setSelectedCategory2(getCategory2Options(tree, category1)[0] ?? null);
                }}
                onCommit={(nextValue) => renameCategory1(category1, nextValue)}
                onRemove={() => removeCategory1(category1)}
                deleteLabel={text.deleteCategory}
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50/80 p-4 shadow-sm ring-1 ring-blue-100/80">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">{text.category2Label}</div>
              <div className="text-xs text-stone-500">현재 선택한 대분류에 연결된 중분류만 표시됩니다.</div>
            </div>
            <button type="button" onClick={addCategory2} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-300 bg-white text-lg font-medium text-blue-700">+</button>
          </div>
          <div className="space-y-2">
            {category2Options.map((category2) => (
              <CategoryValueRow
                key={category2}
                value={category2}
                selected={activeCategory2 === category2}
                onSelect={() => setSelectedCategory2(category2)}
                onCommit={(nextValue) => renameCategory2(category2, nextValue)}
                onRemove={() => removeCategory2(category2)}
                deleteLabel={text.deleteCategory}
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-sm ring-1 ring-emerald-100/80">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-900">{text.category3Label}</div>
              <div className="text-xs text-stone-500">현재 선택한 중분류에 연결된 소분류만 표시됩니다.</div>
            </div>
            <button type="button" onClick={addCategory3} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-white text-lg font-medium text-emerald-700">+</button>
          </div>
          <div className="space-y-2">
            {category3Options.map((category3) => (
              <CategoryValueRow
                key={category3}
                value={category3}
                selected={false}
                onSelect={() => undefined}
                onCommit={(nextValue) => renameCategory3(category3, nextValue)}
                onRemove={() => removeCategory3(category3)}
                deleteLabel={text.deleteCategory}
              />
            ))}
          </div>
        </section>
      </div>
    </ModalShell>
  );
}

export function CategoryRuleListPanel({
  filteredRules,
  selectedRuleId,
  draggingRuleId,
  dragOverRuleId,
  onSelectRule,
  onAddRule,
  onSearchQueryChange,
  searchQuery,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  text,
}: {
  filteredRules: EditableCategoryRule[];
  selectedRuleId: string | null;
  draggingRuleId: string | null;
  dragOverRuleId: string | null;
  onSelectRule: (ruleId: string) => void;
  onAddRule: () => void;
  onSearchQueryChange: (value: string) => void;
  searchQuery: string;
  onDragStart: (ruleId: string) => void;
  onDragEnd: () => void;
  onDragOver: (ruleId: string) => void;
  onDrop: (ruleId: string) => void;
  text: CategoryRulesManagerText;
}) {
  return (
    <article className="hidden rounded-3xl border border-stone-200 bg-white p-5 shadow-sm md:block">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-stone-900">{text.selectedRuleTitle}</h2>
          <p className="text-sm text-stone-500">{text.listCountLabel.replace("{count}", String(filteredRules.length))}</p>
        </div>
        <button type="button" onClick={onAddRule} className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800">
          {text.addRule}
        </button>
      </div>
      <label className="mb-4 block">
        <span className="sr-only">{text.mobileSearchPlaceholder}</span>
        <input type="search" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder={text.mobileSearchPlaceholder} className={MODAL_INPUT_CLASS} />
      </label>
      <div className="flex max-h-[calc(100vh-18rem)] flex-col gap-3 overflow-y-auto pr-1">
        {filteredRules.map((rule) => {
          const isSelected = rule.id === selectedRuleId;
          const isDragging = draggingRuleId === rule.id;
          const isDropTarget = dragOverRuleId === rule.id && draggingRuleId !== rule.id;
          return (
            <div
              key={rule.id}
              draggable
              onDragStart={() => onDragStart(rule.id)}
              onDragEnd={onDragEnd}
              onDragOver={(event) => {
                event.preventDefault();
                onDragOver(rule.id);
              }}
              onDrop={() => onDrop(rule.id)}
              className={[
                "rounded-3xl border px-4 py-4 shadow-sm transition duration-200",
                isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300 hover:bg-white",
                isDragging ? "scale-[0.985] opacity-80 shadow-2xl ring-2 ring-stone-300" : "",
                isDropTarget ? "border-sky-400 ring-2 ring-sky-200" : "",
              ].join(" ")}
            >
              <button type="button" onClick={() => onSelectRule(rule.id)} className="block w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="truncate text-sm font-semibold">{rule.name}</div>
                    <div className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{rule.enabled ? text.enabled : text.disabled}</div>
                  </div>
                  <span className={`shrink-0 text-xs transition-transform ${isDragging ? "scale-110" : ""} ${isSelected ? "text-stone-200" : "text-stone-400"}`}>⋮⋮</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rule.keywords.length > 0 ? rule.keywords.map((keyword, keywordIndex) => (
                    <span key={`${rule.id}-${keywordIndex}-${keyword}`} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isSelected ? "bg-white/10 text-white" : "bg-white text-stone-600"}`}>#{keyword}</span>
                  )) : <span className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{text.noKeywords}</span>}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function CategoryRuleEditorPanel({
  selectedRule,
  keywordText,
  onDuplicateRule,
  onDeleteRule,
  onUpdateName,
  onUpdateEnabled,
  onKeywordTextChange,
  category1Options,
  category2Options,
  category3Options,
  currentCategory1,
  currentCategory2,
  currentCategory3,
  onChangeCategory1,
  onChangeCategory2,
  onChangeCategory3,
  onChangeReason,
  testTitle,
  onChangeTestTitle,
  preview,
  text,
  ruleNameInputRef,
}: {
  selectedRule: EditableCategoryRule | null;
  keywordText: string;
  onDuplicateRule: () => void;
  onDeleteRule: () => void;
  onUpdateName: (value: string) => void;
  onUpdateEnabled: (value: boolean) => void;
  onKeywordTextChange: (value: string) => void;
  category1Options: string[];
  category2Options: string[];
  category3Options: string[];
  currentCategory1: string;
  currentCategory2: string;
  currentCategory3: string;
  onChangeCategory1: (value: string) => void;
  onChangeCategory2: (value: string) => void;
  onChangeCategory3: (value: string) => void;
  onChangeReason: (value: string) => void;
  testTitle: string;
  onChangeTestTitle: (value: string) => void;
  preview: ReturnType<typeof buildCategoryRuleMatchPreview>;
  text: CategoryRulesManagerText;
  ruleNameInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      {selectedRule ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onDuplicateRule} className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">{text.duplicateRule}</button>
            <button type="button" onClick={onDeleteRule} className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100">{text.deleteRule}</button>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">{text.ruleNameLabel}</span>
            <input
              ref={ruleNameInputRef}
              value={selectedRule.name}
              placeholder={text.ruleNamePlaceholder}
              onChange={(event) => onUpdateName(event.target.value)}
              className={MODAL_INPUT_CLASS}
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <input type="checkbox" checked={selectedRule.enabled} onChange={(event) => onUpdateEnabled(event.target.checked)} className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500" />
            <span className="text-sm font-medium text-stone-700">{selectedRule.enabled ? text.enabled : text.disabled}</span>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">{text.keywordsLabel}</span>
            <input
              value={keywordText || buildTaggedKeywordInput(selectedRule.keywords)}
              onChange={(event) => onKeywordTextChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                event.currentTarget.blur();
              }}
              placeholder={text.keywordsPlaceholder}
              className={MODAL_INPUT_CLASS}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">{text.category1Label}</span>
              <select value={currentCategory1} onChange={(event) => onChangeCategory1(event.target.value)} className={MODAL_SELECT_CLASS}>
                {category1Options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">{text.category2Label}</span>
              <select value={currentCategory2} onChange={(event) => onChangeCategory2(event.target.value)} className={MODAL_SELECT_CLASS}>
                {category2Options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">{text.category3Label}</span>
              <select value={currentCategory3} onChange={(event) => onChangeCategory3(event.target.value)} className={MODAL_SELECT_CLASS}>
                {category3Options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">{text.reasonLabel}</span>
            <textarea
              value={selectedRule.recommendation.reason}
              placeholder={text.reasonPlaceholder}
              onChange={(event) => onChangeReason(event.target.value)}
              rows={4}
              className={MODAL_TEXTAREA_CLASS}
            />
          </label>

          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-3 text-sm font-semibold text-stone-900">{text.testInputLabel}</div>
            <div className="space-y-4">
              <input value={testTitle} onChange={(event) => onChangeTestTitle(event.target.value)} placeholder={text.testInputPlaceholder} className={MODAL_INPUT_CLASS} />
              <TestResultPanel preview={preview} text={text} />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">{text.noRuleSelected}</div>
      )}
    </article>
  );
}

"use client";

import { useEffect, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import type { CategoryTreeRuntime } from "@/lib/system/categoryTreeRuntime";
import { getCategory1Options, getCategory2Options, getCategory3Options } from "@/lib/system/categoryTreeRuntime";
import { getNormalizedCategorySelection } from "@/lib/utils/categoryOptions";
import type { CategoryRulesManagerText } from "@/lib/system/categoryRuleText";
import { CategoryValueRow, FooterIconButton, ResetIcon, SaveIcon } from "./CategoryRulePanelShared";

function normalizeTreeSelection(tree: CategoryTreeRuntime, currentCategory1: string | null, currentCategory2: string | null) {
  return getNormalizedCategorySelection(tree, currentCategory1, currentCategory2);
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
    const newName = text.newCategory1Name.replace("{count}", String(category1Options.length + 1));
    onChangeTree({
      ...tree,
      [newName]: { [text.defaultNewCategory2Name]: [text.defaultNewCategory3Name] },
    });
    setSelectedCategory1(newName);
    setSelectedCategory2(text.defaultNewCategory2Name);
  }

  function addCategory2() {
    if (!activeCategory1) return;
    const newName = text.newCategory2Name.replace("{count}", String(category2Options.length + 1));
    onChangeTree({
      ...tree,
      [activeCategory1]: { ...(tree[activeCategory1] ?? {}), [newName]: [text.defaultNewCategory3Name] },
    });
    setSelectedCategory2(newName);
  }

  function addCategory3() {
    if (!activeCategory1 || !activeCategory2) return;
    const newName = text.newCategory3Name.replace("{count}", String(category3Options.length + 1));
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
              <div className="text-xs text-stone-500">{text.category1HelpText}</div>
            </div>
            <button type="button" onClick={addCategory1} aria-label={text.addCategory1} title={text.addCategory1} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-lg font-medium text-stone-700">+</button>
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
              <div className="text-xs text-stone-500">{text.category2HelpText}</div>
            </div>
            <button type="button" onClick={addCategory2} aria-label={text.addCategory2} title={text.addCategory2} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-300 bg-white text-lg font-medium text-blue-700">+</button>
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
              <div className="text-xs text-stone-500">{text.category3HelpText}</div>
            </div>
            <button type="button" onClick={addCategory3} aria-label={text.addCategory3} title={text.addCategory3} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-white text-lg font-medium text-emerald-700">+</button>
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

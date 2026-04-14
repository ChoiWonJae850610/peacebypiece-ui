"use client";

import { type RefObject } from "react";
import { MODAL_INPUT_CLASS, MODAL_SELECT_CLASS, MODAL_TEXTAREA_CLASS } from "@/components/common/modal/modalFieldClassNames";
import type { EditableCategoryRule } from "@/lib/system/categoryRuleEditor";
import { buildCategoryRuleMatchPreview, buildTaggedKeywordInput } from "@/lib/system/categoryRuleEditor";
import type { CategoryRulesManagerText } from "@/lib/system/categoryRuleText";
import { TestResultPanel } from "./CategoryRulePanelShared";

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
  ruleNameInputRef: RefObject<HTMLInputElement | null>;
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

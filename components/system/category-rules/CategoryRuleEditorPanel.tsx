"use client";

import { type RefObject } from "react";
import { MODAL_INPUT_CLASS, MODAL_TEXTAREA_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { WaflSelect } from "@/components/common/ui";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import { SYSTEM_CARD_CLASS, SYSTEM_MUTED_CARD_CLASS, SYSTEM_VALUE_TEXT_CLASS } from "@/components/system/systemSemanticClassNames";
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
    <article className={SYSTEM_CARD_CLASS}>
      {selectedRule ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <AdminButton onClick={onDuplicateRule}>{text.duplicateRule}</AdminButton>
            <AdminButton onClick={onDeleteRule} variant="danger">{text.deleteRule}</AdminButton>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--pbp-text-muted)]">{text.ruleNameLabel}</span>
            <input
              ref={ruleNameInputRef}
              value={selectedRule.name}
              placeholder={text.ruleNamePlaceholder}
              onChange={(event) => onUpdateName(event.target.value)}
              className={MODAL_INPUT_CLASS}
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-4 py-3">
            <input type="checkbox" checked={selectedRule.enabled} onChange={(event) => onUpdateEnabled(event.target.checked)} className="h-4 w-4 rounded border-[var(--pbp-border-strong)] text-[var(--pbp-action-primary-surface)] focus:ring-[var(--pbp-focus-ring)]" />
            <AdminStatusBadge tone={selectedRule.enabled ? "success" : "neutral"}>{selectedRule.enabled ? text.enabled : text.disabled}</AdminStatusBadge>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--pbp-text-muted)]">{text.keywordsLabel}</span>
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
              <span className="text-sm font-medium text-[var(--pbp-text-muted)]">{text.category1Label}</span>
              <WaflSelect
                value={currentCategory1}
                onValueChange={onChangeCategory1}
                options={category1Options.map((option) => ({ value: option, label: option }))}
                ariaLabel={text.category1Label}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--pbp-text-muted)]">{text.category2Label}</span>
              <WaflSelect
                value={currentCategory2}
                onValueChange={onChangeCategory2}
                options={category2Options.map((option) => ({ value: option, label: option }))}
                ariaLabel={text.category2Label}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--pbp-text-muted)]">{text.category3Label}</span>
              <WaflSelect
                value={currentCategory3}
                onValueChange={onChangeCategory3}
                options={category3Options.map((option) => ({ value: option, label: option }))}
                ariaLabel={text.category3Label}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--pbp-text-muted)]">{text.reasonLabel}</span>
            <textarea
              value={selectedRule.recommendation.reason}
              placeholder={text.reasonPlaceholder}
              onChange={(event) => onChangeReason(event.target.value)}
              rows={4}
              className={MODAL_TEXTAREA_CLASS}
            />
          </label>

          <div className={SYSTEM_MUTED_CARD_CLASS}>
            <div className={`mb-3 text-sm font-semibold ${SYSTEM_VALUE_TEXT_CLASS}`}>{text.testInputLabel}</div>
            <div className="space-y-4">
              <input value={testTitle} onChange={(event) => onChangeTestTitle(event.target.value)} placeholder={text.testInputPlaceholder} className={MODAL_INPUT_CLASS} />
              <TestResultPanel preview={preview} text={text} />
            </div>
          </div>
        </div>
      ) : (
        <AdminEmptyState title={text.noRuleSelected} />
      )}
    </article>
  );
}

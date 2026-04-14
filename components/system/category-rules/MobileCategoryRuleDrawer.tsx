"use client";

import { useRef } from "react";
import { MODAL_INPUT_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import type { EditableCategoryRule } from "@/lib/system/categoryRuleEditor";
import type { CategoryRulesManagerText } from "@/lib/system/categoryRuleText";
import { HomeChevronButton } from "./CategoryRulePanelShared";

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

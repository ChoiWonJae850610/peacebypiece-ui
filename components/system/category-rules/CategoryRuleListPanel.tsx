"use client";

import { MODAL_INPUT_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import type { EditableCategoryRule } from "@/lib/system/categoryRuleEditor";
import type { CategoryRulesManagerText } from "@/lib/system/categoryRuleText";

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
        <AdminButton onClick={onAddRule} variant="primary">
          {text.addRule}
        </AdminButton>
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
                    <AdminStatusBadge tone={rule.enabled ? (isSelected ? "inverse" : "success") : "neutral"} size="xs">{rule.enabled ? text.enabled : text.disabled}</AdminStatusBadge>
                  </div>
                  <span className={`shrink-0 text-xs transition-transform ${isDragging ? "scale-110" : ""} ${isSelected ? "text-stone-200" : "text-stone-400"}`}>⋮⋮</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {rule.keywords.length > 0 ? rule.keywords.map((keyword, keywordIndex) => (
                    <AdminStatusBadge key={`${rule.id}-${keywordIndex}-${keyword}`} tone={isSelected ? "inverse" : "neutral"} size="xs">#{keyword}</AdminStatusBadge>
                  )) : <span className={`text-xs ${isSelected ? "text-stone-200" : "text-stone-500"}`}>{text.noKeywords}</span>}
                </div>
              </button>
            </div>
          );
        })}
      {filteredRules.length === 0 ? (
          <AdminEmptyState title={text.noRuleSelected} description={text.noKeywords} />
        ) : null}
      </div>
    </article>
  );
}

"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MODAL_INPUT_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminEmptyState } from "@/components/admin/common/AdminEmptyState";
import { AdminStatusBadge } from "@/components/admin/common/AdminStatusBadge";
import type { CategoryRulesManagerText } from "@/lib/system/categoryRuleText";
import { buildCategoryRuleMatchPreview } from "@/lib/system/categoryRuleEditor";

export function HomeChevronButton({
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
  return (
    <AdminButton
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      variant={tone === "dark" ? "ghost" : "secondary"}
      className={`h-8 w-8 px-0 text-sm ${tone === "dark" ? "border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white" : ""}`}
    >
      <span className={`block transition-transform ${direction === "up" ? "rotate-180" : "rotate-0"}`}>▾</span>
    </AdminButton>
  );
}

export function FooterIconButton({
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
  return (
    <AdminButton
      onClick={onClick}
      aria-label={label}
      title={label}
      variant={tone === "primary" ? "primary" : "secondary"}
      className="h-11 w-11 px-0"
    >
      <span className="sr-only">{label}</span>
      {children}
    </AdminButton>
  );
}

export function ResetIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v5h5" />
      <path d="M20 12a8 8 0 1 1-2.35-5.65L20 9" />
    </svg>
  );
}

export function SaveIcon() {
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

export function CategoryValueRow({ value, selected, onSelect, onCommit, onRemove, deleteLabel }: CategoryValueRowProps) {
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
      <AdminButton
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        variant="danger"
        className="h-10 w-10 rounded-xl px-0 text-lg"
        aria-label={deleteLabel}
        title={deleteLabel}
      >
        -
      </AdminButton>
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
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-medium text-stone-900">{text.matchedKeywordsLabel}:</span>
            {preview.matchedKeywords.map((keyword) => (
              <AdminStatusBadge key={keyword} tone="info" size="xs">#{keyword}</AdminStatusBadge>
            ))}
          </div>
          <div>
            <span className="font-medium text-stone-900">{text.recommendationLabel}:</span> {preview.recommendationLabel}
          </div>
          <div className="text-stone-600">{preview.reason}</div>
        </div>
      ) : (
        <AdminEmptyState title={text.noMatch} />
      )}
    </div>
  );
}

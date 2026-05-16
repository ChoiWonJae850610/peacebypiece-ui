"use client";

import type { ReactNode } from "react";

export type AdminSegmentedTabItem<TId extends string> = {
  id: TId;
  label: ReactNode;
  title?: string;
};

type AdminSegmentedTabsProps<TId extends string> = {
  items: readonly AdminSegmentedTabItem<TId>[];
  activeId: TId;
  onChange: (id: TId) => void;
  ariaLabel?: string;
  className?: string;
};

export default function AdminSegmentedTabs<TId extends string>({
  items,
  activeId,
  onChange,
  ariaLabel,
  className = "",
}: AdminSegmentedTabsProps<TId>) {
  return (
    <div
      className={[
        "flex w-full justify-start overflow-x-auto xl:w-auto xl:justify-end",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
    >
      <div className="inline-flex min-w-max rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-1 shadow-sm">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={[
                "rounded-full px-4 py-2 text-xs font-semibold transition",
                isActive
                  ? "bg-[var(--pbp-action-primary)] text-[var(--pbp-action-primary-text)] shadow-sm"
                  : "pbp-text-muted hover:bg-[var(--pbp-surface)] hover:text-[var(--pbp-text-primary)]",
              ].join(" ")}
              aria-pressed={isActive}
              title={item.title}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

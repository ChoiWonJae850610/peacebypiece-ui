"use client";

import type { ReactNode } from "react";

export type WaflSettingsTabTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger";

export type WaflSettingsTabItem<TId extends string> = {
  id: TId;
  title: ReactNode;
  description?: ReactNode;
  tone?: WaflSettingsTabTone;
};

type WaflSettingsTabsProps<TId extends string> = {
  items: readonly WaflSettingsTabItem<TId>[];
  activeId: TId;
  onChange: (id: TId) => void;
  ariaLabel?: string;
  className?: string;
  gridClassName?: string;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const toneDotClassNames: Record<WaflSettingsTabTone, string> = {
  neutral: "bg-[var(--pbp-text-subtle)]",
  brand: "bg-[var(--pbp-brand-primary)]",
  info: "bg-[var(--pbp-status-info-fg)]",
  success: "bg-[var(--pbp-status-success-fg)]",
  warning: "bg-[var(--pbp-status-warning-fg)]",
  danger: "bg-[var(--pbp-status-danger-fg)]",
};

export default function WaflSettingsTabs<TId extends string>({
  items,
  activeId,
  onChange,
  ariaLabel,
  className = "",
  gridClassName = "grid gap-2 md:grid-cols-5",
}: WaflSettingsTabsProps<TId>) {
  return (
    <nav className={joinClassNames("rounded-[1.5rem] border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-2", className)} aria-label={ariaLabel}>
      <div className={gridClassName}>
        {items.map((item) => {
          const active = item.id === activeId;
          const tone = item.tone ?? "brand";
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(item.id)}
              className={joinClassNames(
                "flex min-h-[64px] w-full flex-col rounded-2xl border px-4 py-3 text-left transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)]",
                active
                  ? "border-[var(--pbp-brand-muted)] bg-[var(--pbp-surface-selected)] text-[var(--pbp-text-primary)] shadow-sm"
                  : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-muted)] hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-soft)]",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--pbp-text-primary)]">
                <span className={joinClassNames("h-2 w-2 rounded-full", toneDotClassNames[tone])} aria-hidden="true" />
                {item.title}
              </span>
              {item.description ? <span className="mt-2 line-clamp-1 text-xs leading-5 text-[var(--pbp-text-muted)]">{item.description}</span> : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

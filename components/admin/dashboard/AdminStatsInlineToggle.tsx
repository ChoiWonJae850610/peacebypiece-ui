"use client";

import { AdminButton } from "@/components/admin/common/AdminButton";

export type AdminStatsInlineToggleItem<T extends string> = {
  key: T;
  label: string;
  title?: string;
};

export function AdminStatsInlineToggle<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: AdminStatsInlineToggleItem<T>[];
  value: T;
  onChange: (nextValue: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      className="flex max-w-full overflow-x-auto rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-1"
      role="group"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <AdminButton
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          variant={value === item.key ? "secondary" : "ghost"}
          size="sm"
          className="min-h-7 shrink-0 px-3 py-1 text-xs"
          title={item.title}
          aria-pressed={value === item.key}
        >
          {item.label}
        </AdminButton>
      ))}
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { WaflButton } from "./WaflButton";

export type WaflSegmentedTabItem<TKey extends string> = {
  key: TKey;
  label: ReactNode;
  disabled?: boolean;
};

type WaflSegmentedTabsProps<TKey extends string> = {
  items: Array<WaflSegmentedTabItem<TKey>>;
  value: TKey;
  onChange: (value: TKey) => void;
  className?: string;
  itemClassName?: string;
  sticky?: boolean;
  ariaLabel?: string;
};

export default function WaflSegmentedTabs<TKey extends string>({
  items,
  value,
  onChange,
  className,
  itemClassName,
  sticky = false,
  ariaLabel,
}: WaflSegmentedTabsProps<TKey>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "grid min-w-0 gap-2 wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-1 shadow-none",
        sticky ? "sticky top-0 z-10 backdrop-blur" : null,
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const selected = value === item.key;

        return (
          <WaflButton
            key={item.key}
            role="tab"
            aria-selected={selected}
            disabled={item.disabled}
            variant={selected ? "primary" : "ghost"}
            size="sm"
            width="full"
            className={cn(
              "rounded-[18px] shadow-none",
              selected ? "shadow-none" : "text-[var(--pbp-text-muted)] hover:bg-[var(--pbp-surface)]",
              itemClassName,
            )}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </WaflButton>
        );
      })}
    </div>
  );
}

"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AppSelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type AppSelectSize = "sm" | "md";
type AppSelectWidth = "auto" | "full";

const sizeClassMap: Record<AppSelectSize, string> = {
  sm: "min-h-9 rounded-xl px-3 text-xs",
  md: "min-h-11 rounded-2xl px-4 text-sm",
};

const widthClassMap: Record<AppSelectWidth, string> = {
  auto: "min-w-36",
  full: "w-full",
};

type AppSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: AppSelectSize;
  width?: AppSelectWidth;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
};

export default function AppSelect({
  value,
  onValueChange,
  options,
  placeholder = "선택",
  disabled = false,
  size = "md",
  width = "full",
  className,
  triggerClassName,
  contentClassName,
  ariaLabel,
}: AppSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        aria-label={ariaLabel ?? placeholder}
        className={cn(
          "inline-flex items-center justify-between gap-3 border border-[var(--pbp-border)] bg-[var(--pbp-surface)] font-semibold text-[var(--pbp-text-primary)] shadow-sm transition hover:border-[var(--pbp-border-strong)] disabled:cursor-not-allowed disabled:bg-[var(--pbp-surface-muted)] disabled:text-[var(--pbp-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--pbp-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--pbp-surface)]",
          sizeClassMap[size],
          widthClassMap[width],
          className,
          triggerClassName,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="text-[var(--pbp-text-muted)]">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className={cn(
            "z-[70] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-1 text-[var(--pbp-text-primary)] shadow-xl",
            contentClassName,
          )}
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex min-h-9 cursor-pointer select-none items-center rounded-xl px-8 py-2 text-sm font-semibold outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-[var(--pbp-surface-muted)] data-[disabled]:text-[var(--pbp-text-faint)]"
              >
                <Select.ItemIndicator className="absolute left-2 inline-flex items-center text-[var(--pbp-accent)]">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

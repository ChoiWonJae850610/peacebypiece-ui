"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AppSelectOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

type AppSelectSize = "sm" | "md";
type AppSelectWidth = "auto" | "full";

const sizeClassMap: Record<AppSelectSize, string> = {
  sm: "min-h-9 rounded-xl px-3 text-base md:text-xs",
  md: "min-h-11 rounded-2xl px-4 text-base md:text-sm",
};

const widthClassMap: Record<AppSelectWidth, string> = {
  auto: "min-w-36",
  full: "w-full",
};

const EMPTY_SELECT_VALUE = "__app_select_empty_value__";

type AppSelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: AppSelectSize;
  width?: AppSelectWidth;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
  name?: string;
};

export default function AppSelect({
  value,
  defaultValue,
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
  name,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const suppressOpenUntilRef = useRef(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const rootValue = value === undefined ? undefined : value === "" ? EMPTY_SELECT_VALUE : value;
  const rootDefaultValue = defaultValue === undefined ? undefined : defaultValue === "" ? EMPTY_SELECT_VALUE : defaultValue;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;

      const isInsideTrigger = Boolean(triggerRef.current?.contains(target));
      const isInsideContent = Boolean(contentRef.current?.contains(target));
      if (isInsideTrigger || isInsideContent) return;

      setOpen(false);
      triggerRef.current?.blur();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [open]);

  return (
    <Select.Root
      name={name}
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && Date.now() < suppressOpenUntilRef.current) return;
        setOpen(nextOpen);
      }}
      value={rootValue}
      defaultValue={rootDefaultValue}
      onValueChange={(nextValue) => {
        onValueChange?.(nextValue === EMPTY_SELECT_VALUE ? "" : nextValue);
        setOpen(false);
      }}
      disabled={disabled}
    >
      <Select.Trigger
        ref={triggerRef}
        aria-label={ariaLabel ?? placeholder}
        onPointerDownCapture={(event: PointerEvent<HTMLButtonElement>) => {
          if (!open) return;
          suppressOpenUntilRef.current = Date.now() + 250;
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          event.currentTarget.blur();
        }}
        onClickCapture={(event: MouseEvent<HTMLButtonElement>) => {
          if (Date.now() >= suppressOpenUntilRef.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
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
          ref={contentRef}
          position="popper"
          sideOffset={6}
          className={cn(
            "z-[4000] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-1 text-[var(--pbp-text-primary)] shadow-xl",
            contentClassName,
          )}
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value === "" ? EMPTY_SELECT_VALUE : option.value}
                disabled={option.disabled}
                className="relative flex min-h-9 cursor-pointer select-none items-center rounded-xl px-8 py-2 text-base font-semibold md:text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-[var(--pbp-surface-muted)] data-[disabled]:text-[var(--pbp-text-faint)]"
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

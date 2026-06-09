import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export type WaflFieldSize = "md";

const fieldBaseClass =
  "pbp-field-interaction w-full rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-base text-[var(--pbp-text-primary)] outline-none transition placeholder:text-[var(--pbp-text-muted)] focus:border-[var(--pbp-selected-border)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--pbp-surface)] disabled:cursor-not-allowed disabled:bg-[var(--pbp-surface-muted)] disabled:text-[var(--pbp-text-muted)] md:text-sm";

export const WAFL_FIELD_INPUT_CLASS = cn(fieldBaseClass, "h-11 px-3");
export const WAFL_FIELD_TEXTAREA_CLASS = cn(
  fieldBaseClass,
  "min-h-24 resize-y px-3 py-2",
);

export type WaflInputProps = InputHTMLAttributes<HTMLInputElement>;

export const WaflInput = forwardRef<HTMLInputElement, WaflInputProps>(
  function WaflInput({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        data-wafl-component="input"
        className={cn(WAFL_FIELD_INPUT_CLASS, className)}
        {...props}
      />
    );
  },
);

export type WaflTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const WaflTextarea = forwardRef<HTMLTextAreaElement, WaflTextareaProps>(
  function WaflTextarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        data-wafl-component="textarea"
        className={cn(WAFL_FIELD_TEXTAREA_CLASS, className)}
        {...props}
      />
    );
  },
);

export type WaflInfoBoxTone = "neutral" | "selected" | "muted";

const infoBoxToneClassMap: Record<WaflInfoBoxTone, string> = {
  neutral:
    "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]",
  selected:
    "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-surface)] text-[var(--pbp-selected-text)]",
  muted:
    "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-primary)]",
};

export function WaflInfoBox({
  children,
  className,
  tone = "neutral",
  component = "info-card",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: WaflInfoBoxTone;
  component?: string;
}) {
  return (
    <div
      data-wafl-component={component}
      className={cn(
        "min-w-0 rounded-[var(--pbp-radius-wafl)] border p-3",
        infoBoxToneClassMap[tone],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function WaflSelectableCard({
  children,
  className,
  selected = false,
  component = "selectable-card",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  selected?: boolean;
  component?: string;
}) {
  return (
    <button
      type="button"
      data-wafl-component={component}
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-3 rounded-[var(--pbp-radius-wafl)] border px-4 py-3 text-left transition disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-action-primary-surface)] text-[var(--pbp-action-primary-text)]"
          : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)] hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

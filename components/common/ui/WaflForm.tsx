import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";
import { waflFieldDensityClassMap, waflInteractiveClass, getWaflPrimitiveClassName } from "./WaflPrimitive";

export type WaflFieldSize = "sm" | "md" | "lg";

const fieldSizeClassMap: Record<WaflFieldSize, string> = {
  sm: waflFieldDensityClassMap.compact,
  md: waflFieldDensityClassMap.default,
  lg: waflFieldDensityClassMap.spacious,
};

const fieldBaseClass = cn(
  "pbp-field-interaction w-full wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)] outline-none placeholder:text-[var(--pbp-text-muted)] focus:border-[var(--pbp-selected-border)] disabled:cursor-not-allowed disabled:bg-[var(--pbp-surface-muted)] disabled:text-[var(--pbp-text-muted)]",
  waflInteractiveClass,
);

export const WAFL_FIELD_INPUT_CLASS = cn(fieldBaseClass, fieldSizeClassMap.md);
export const WAFL_FIELD_TEXTAREA_CLASS = cn(
  fieldBaseClass,
  "min-h-24 resize-y px-3 py-2",
);

export type WaflInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  fieldSize?: WaflFieldSize;
};

export const WaflInput = forwardRef<HTMLInputElement, WaflInputProps>(
  function WaflInput({ className, fieldSize = "md", ...props }, ref) {
    return (
      <input
        ref={ref}
        data-wafl-component="input"
        data-wafl-foundation="control"
        data-wafl-density={fieldSize}
        className={cn(fieldBaseClass, fieldSizeClassMap[fieldSize], className)}
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
        data-wafl-component="textarea" data-wafl-foundation="control"
        className={cn(WAFL_FIELD_TEXTAREA_CLASS, className)}
        {...props}
      />
    );
  },
);

export type WaflInfoBoxTone = "neutral" | "selected" | "muted";
export type WaflInfoBoxShape = "surface" | "control";

export function WaflInfoBox({
  children,
  className,
  tone = "neutral",
  shape = "surface",
  component = "info-card",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: WaflInfoBoxTone;
  shape?: WaflInfoBoxShape;
  component?: string;
}) {
  return (
    <div
      data-wafl-component={component}
      data-wafl-foundation={shape}
      className={cn(
        getWaflPrimitiveClassName({ shape, tone: tone === "neutral" ? "surface" : tone, className: "p-3" }),
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
      data-wafl-foundation="control"
      className={cn(
        "flex w-full min-w-0 items-center justify-between gap-3 wafl-shape-control border px-4 py-3 text-left disabled:pointer-events-none disabled:opacity-50",
        waflInteractiveClass,
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

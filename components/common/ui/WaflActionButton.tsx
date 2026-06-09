import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WaflActionButtonTone = "neutral" | "primary" | "danger" | "dangerSoft";
export type WaflActionButtonSize = "sm" | "md" | "lg";

const toneClassMap: Record<WaflActionButtonTone, string> = {
  neutral:
    "border-[var(--pbp-border)] bg-[var(--pbp-action-secondary-surface)] text-[var(--pbp-action-secondary-text)] hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-action-secondary-surface-hover)]",
  primary:
    "border-[var(--pbp-border-strong)] bg-[var(--pbp-action-primary-surface)] text-[var(--pbp-action-primary-text)] hover:bg-[var(--pbp-action-primary-surface-hover)]",
  danger:
    "border-transparent bg-[var(--pbp-action-danger-surface)] text-[var(--pbp-action-danger-text)] hover:bg-[var(--pbp-action-danger-surface-hover)]",
  dangerSoft:
    "border-[var(--pbp-action-danger-soft-border)] bg-[var(--pbp-action-secondary-surface)] text-[var(--pbp-action-danger-soft-text)] hover:bg-[var(--pbp-action-danger-soft-surface)]",
};

const sizeClassMap: Record<WaflActionButtonSize, string> = {
  sm: "h-8 min-h-8 w-8 min-w-8 [&>svg]:h-3 [&>svg]:w-3",
  md: "h-9 min-h-9 w-9 min-w-9 [&>svg]:h-3 [&>svg]:w-3",
  lg: "h-10 min-h-10 w-10 min-w-10 [&>svg]:h-3.5 [&>svg]:w-3.5",
};

const compactSizeClassMap: Record<WaflActionButtonSize, string> = {
  sm: "h-8 min-h-8 min-w-10 px-3 text-[11px] leading-none",
  md: "h-9 min-h-9 min-w-12 px-3.5 text-xs leading-none",
  lg: "h-10 min-h-10 min-w-14 px-4 text-sm leading-none",
};

export const WAFL_ACTION_BUTTON_BASE_CLASS =
  "inline-flex shrink-0 items-center justify-center rounded-full border font-semibold transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)] [&>svg]:pointer-events-none [&>svg]:shrink-0";

export function getWaflActionButtonClassName({
  tone = "neutral",
  size = "sm",
  compact = false,
  className = "",
}: {
  tone?: WaflActionButtonTone;
  size?: WaflActionButtonSize;
  compact?: boolean;
  className?: string;
} = {}) {
  return cn(
    WAFL_ACTION_BUTTON_BASE_CLASS,
    compact ? compactSizeClassMap[size] : sizeClassMap[size],
    compact ? "gap-1.5" : "p-0",
    toneClassMap[tone],
    className,
  );
}

type WaflActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  label: string;
  tone?: WaflActionButtonTone;
  size?: WaflActionButtonSize;
  compact?: boolean;
  showSrLabel?: boolean;
  children: ReactNode;
};

export function WaflActionButton({
  label,
  tone = "neutral",
  size = "sm",
  compact = false,
  showSrLabel = true,
  className = "",
  children,
  type = "button",
  ...props
}: WaflActionButtonProps) {
  return (
    <button
      type={type}
      data-wafl-component="action-button"
      aria-label={label}
      title={label}
      className={getWaflActionButtonClassName({ tone, size, compact, className })}
      {...props}
    >
      {children}
      {showSrLabel ? <span className="sr-only">{label}</span> : null}
    </button>
  );
}

type WaflActionLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "aria-label" | "children"
> & {
  label: string;
  tone?: WaflActionButtonTone;
  size?: WaflActionButtonSize;
  compact?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

export function WaflActionLink({
  label,
  tone = "neutral",
  size = "sm",
  compact = false,
  className = "",
  children,
  disabled = false,
  href,
  tabIndex,
  ...props
}: WaflActionLinkProps) {
  return (
    <a
      href={disabled ? undefined : href}
      data-wafl-component="action-button"
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      className={getWaflActionButtonClassName({
        tone: disabled ? "neutral" : tone,
        size,
        compact,
        className: cn(disabled ? "pointer-events-none opacity-50" : "", className),
      })}
      {...props}
    >
      {children}
      <span className="sr-only">{label}</span>
    </a>
  );
}

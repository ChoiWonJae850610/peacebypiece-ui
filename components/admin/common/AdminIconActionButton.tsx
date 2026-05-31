import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminIconActionButtonTone = "neutral" | "primary" | "danger";

type IconActionBaseProps = {
  label: string;
  tone?: AdminIconActionButtonTone;
  className?: string;
  children: ReactNode;
};

const toneClassMap: Record<AdminIconActionButtonTone, string> = {
  neutral:
    "border-[var(--pbp-border)] bg-[var(--pbp-action-secondary-surface)] text-[var(--pbp-action-secondary-text)] shadow-sm hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-action-secondary-surface-hover)]",
  primary:
    "border-[var(--pbp-border-strong)] bg-[var(--pbp-action-primary-surface)] text-[var(--pbp-action-primary-text)] shadow-sm hover:bg-[var(--pbp-action-primary-surface-hover)]",
  danger:
    "border-transparent bg-[var(--pbp-action-danger-surface)] text-[var(--pbp-action-danger-text)] shadow-sm hover:bg-[var(--pbp-action-danger-surface-hover)]",
};

export const ADMIN_ICON_ACTION_BUTTON_CLASS =
  "inline-flex h-8 min-h-8 w-8 min-w-8 shrink-0 items-center justify-center rounded-full border p-0 text-xs font-semibold transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)] [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0";

export function getAdminIconActionButtonClassName({
  tone = "neutral",
  className = "",
}: {
  tone?: AdminIconActionButtonTone;
  className?: string;
} = {}) {
  return cn(ADMIN_ICON_ACTION_BUTTON_CLASS, toneClassMap[tone], className);
}

type AdminIconActionButtonProps = IconActionBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "title" | "children">;

export function AdminIconActionButton({
  label,
  tone = "neutral",
  className = "",
  children,
  type = "button",
  ...props
}: AdminIconActionButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={getAdminIconActionButtonClassName({ tone, className })}
      {...props}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

type AdminIconActionLinkProps = IconActionBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label" | "title" | "children"> & {
    disabled?: boolean;
  };

export function AdminIconActionLink({
  label,
  tone = "neutral",
  className = "",
  children,
  disabled = false,
  href,
  tabIndex,
  ...props
}: AdminIconActionLinkProps) {
  return (
    <a
      href={disabled ? undefined : href}
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : tabIndex}
      className={getAdminIconActionButtonClassName({
        tone: disabled ? "neutral" : tone,
        className: cn(disabled ? "pointer-events-none opacity-50" : "", className),
      })}
      {...props}
    >
      {children}
      <span className="sr-only">{label}</span>
    </a>
  );
}

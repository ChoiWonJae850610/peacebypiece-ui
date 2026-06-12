"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { WaflSurface } from "@/components/common/ui/WaflSurface";
import { cn } from "@/lib/utils";

export type WaflActionMenuItemTone = "neutral" | "danger";

export function WaflActionMenuPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <WaflSurface
      as="div"
      component="action-menu-panel"
      shape="control"
      tone="surface"
      role="menu"
      className={cn("absolute right-0 top-10 z-30 min-w-[132px] overflow-hidden p-1.5 text-xs font-semibold shadow-[var(--pbp-shadow-card)]", className)}
    >
      {children}
    </WaflSurface>
  );
}

export function WaflActionMenuItem({
  icon,
  children,
  tone = "neutral",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  tone?: WaflActionMenuItemTone;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "pbp-interactive-button flex w-full items-center gap-2 wafl-shape-control px-3 py-2 text-left text-xs font-semibold transition-colors",
        tone === "danger"
          ? "text-[var(--pbp-action-danger-soft-text)] hover:bg-[var(--pbp-action-danger-soft-surface)]"
          : "text-[var(--pbp-text-primary)] hover:bg-[var(--pbp-surface-muted)]",
        className,
      )}
      {...props}
    >
      {icon ? <span className="grid h-3.5 w-3.5 shrink-0 place-items-center">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

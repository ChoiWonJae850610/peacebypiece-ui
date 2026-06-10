import {
  createElement,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type WaflSurfaceTone = "surface" | "muted" | "empty";
type WaflSurfaceElement = "div" | "section" | "article" | "header";

const surfaceToneClassMap: Record<WaflSurfaceTone, string> = {
  surface:
    "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]",
  muted:
    "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-primary)]",
  empty:
    "border-[var(--pbp-empty-state-border)] bg-[var(--pbp-empty-state-surface)] text-[var(--pbp-text-muted)]",
};

export function WaflSurface({
  as: Component = "div",
  children,
  className,
  component = "surface",
  tone = "surface",
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: WaflSurfaceElement;
  children?: ReactNode;
  component?: string;
  tone?: WaflSurfaceTone;
}) {
  return createElement(
    Component,
    {
      "data-wafl-component": component,
      className: cn(
        "min-w-0 rounded-[var(--pbp-radius-wafl)] border shadow-none",
        surfaceToneClassMap[tone],
        className,
      ),
      ...props,
    },
    children,
  );
}

export function WaflInfoRow({
  children,
  className,
  component = "info-row",
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  component?: string;
  tone?: WaflSurfaceTone;
}) {
  return (
    <WaflSurface
      component={component}
      tone={tone}
      className={cn(
        "flex items-center justify-between gap-4 px-3 py-2",
        className,
      )}
      {...props}
    >
      {children}
    </WaflSurface>
  );
}

export function WaflSurfaceButton({
  children,
  className,
  component = "surface-button",
  selected = false,
  tone = "surface",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  component?: string;
  selected?: boolean;
  tone?: WaflSurfaceTone;
}) {
  return (
    <button
      type={type}
      data-wafl-component={component}
      className={cn(
        "pbp-interactive-card min-w-0 rounded-[var(--pbp-radius-wafl)] border p-3 text-left shadow-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)] disabled:cursor-not-allowed disabled:opacity-45",
        selected
          ? "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-surface)] text-[var(--pbp-selected-text)]"
          : surfaceToneClassMap[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function WaflEmptyCard({
  children,
  className,
  component = "empty-card",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  component?: string;
}) {
  return (
    <div
      data-wafl-component={component}
      className={cn(
        "min-w-0 rounded-[var(--pbp-radius-wafl)] border border-dashed border-[var(--pbp-empty-state-border)] bg-[var(--pbp-empty-state-surface)] px-4 py-5 text-center text-sm text-[var(--pbp-text-muted)] shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function WaflAddCard({
  children,
  className,
  component = "add-card",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  component?: string;
}) {
  return (
    <div
      data-wafl-component={component}
      className={cn(
        "flex min-w-0 items-center justify-center rounded-[var(--pbp-radius-wafl)] border border-dashed border-[var(--pbp-empty-state-border)] bg-[var(--pbp-empty-state-surface)] px-4 py-4 shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function WaflAddCardButton({
  children,
  className,
  component = "add-card-button",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  component?: string;
}) {
  return (
    <button
      type={type}
      data-wafl-component={component}
      data-wafl-primitive="add-card-button"
      className={cn(
        "pbp-interactive-button flex min-w-0 items-center justify-center rounded-[var(--pbp-radius-wafl)] border border-dashed border-[var(--pbp-empty-state-border)] bg-[var(--pbp-empty-state-surface)] px-4 py-4 shadow-none transition hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)] disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function WaflAddIconBubble({
  className,
  component = "add-card-button-icon",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  component?: string;
}) {
  return (
    <span
      data-wafl-component={component}
      data-wafl-primitive="add-card-button-icon"
      className={cn(
        "pbp-sidepanel-preview-surface inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--pbp-radius-wafl-icon)] text-[var(--pbp-text-muted)] shadow-none",
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </span>
  );
}

export function WaflFileCard({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
}) {
  return (
    <WaflSurface
      component="file-card"
      tone="surface"
      className={cn(
        "pbp-sidepanel-item pbp-interactive-card relative p-3",
        className,
      )}
      {...props}
    >
      {children}
    </WaflSurface>
  );
}

export function WaflPlainButton({
  children,
  className,
  component = "button",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  component?: string;
}) {
  return (
    <button
      type={type}
      data-wafl-component={component}
      className={cn(
        "pbp-interactive-button rounded-[var(--pbp-radius-wafl)] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-none transition hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)] disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

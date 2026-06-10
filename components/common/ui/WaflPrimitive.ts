import { cn } from "@/lib/utils";

export type WaflPrimitiveShape = "surface" | "control" | "compact" | "icon";
export type WaflPrimitiveDensity = "compact" | "default" | "spacious";
export type WaflPrimitiveTone = "surface" | "muted" | "selected" | "empty" | "warning" | "danger" | "info";
export type WaflPrimitiveState = "normal" | "selected" | "current" | "disabled" | "danger";
export type WaflPrimitiveVariant = "solid" | "outline" | "ghost" | "subtle";

export const waflShapeClassMap: Record<WaflPrimitiveShape, string> = {
  surface: "wafl-shape-surface",
  control: "wafl-shape-control",
  compact: "wafl-shape-compact",
  icon: "wafl-shape-icon",
};

export const waflControlDensityClassMap: Record<WaflPrimitiveDensity, string> = {
  compact: "min-h-8 px-3 py-1.5 text-xs",
  default: "min-h-10 px-4 py-2 text-sm",
  spacious: "min-h-12 px-5 py-3 text-base",
};

export const waflFieldDensityClassMap: Record<WaflPrimitiveDensity, string> = {
  compact: "h-9 px-3 text-base md:text-xs",
  default: "h-11 px-3 text-base md:text-sm",
  spacious: "h-12 px-4 text-base",
};

export const waflIconDensityClassMap: Record<WaflPrimitiveDensity, string> = {
  compact: "h-8 min-h-8 w-8 p-0 text-xs",
  default: "h-10 min-h-10 w-10 p-0 text-sm",
  spacious: "h-12 min-h-12 w-12 p-0 text-base",
};

export const waflCompactDensityClassMap: Record<WaflPrimitiveDensity, string> = {
  compact: "px-2 py-0.5 text-[10px]",
  default: "px-2 py-0.5 text-[11px]",
  spacious: "px-2.5 py-1 text-xs",
};

export const waflToneClassMap: Record<WaflPrimitiveTone, string> = {
  surface: "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]",
  muted: "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-primary)]",
  selected: "border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-surface)] text-[var(--pbp-selected-text)]",
  empty: "border-dashed border-[var(--pbp-empty-state-border)] bg-[var(--pbp-empty-state-surface)] text-[var(--pbp-text-muted)]",
  warning: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
  info: "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-status-info-fg)]",
};

export const waflInteractiveClass =
  "transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)]";

export function getWaflPrimitiveClassName({
  shape,
  tone = "surface",
  className,
}: {
  shape: WaflPrimitiveShape;
  tone?: WaflPrimitiveTone;
  className?: string;
}) {
  return cn("min-w-0 border shadow-none", waflShapeClassMap[shape], waflToneClassMap[tone], className);
}

export type AdminTone = "neutral" | "brand" | "info" | "success" | "warning" | "danger" | "inverse";

export type AdminSurfaceVariant = "base" | "soft" | "selected" | "warning" | "danger";

export const adminToneClassNames: Record<AdminTone, string> = {
  neutral: "border-[var(--pbp-status-neutral-bg)] bg-[var(--pbp-status-neutral-bg)] text-[var(--pbp-status-neutral-fg)]",
  brand: "border-[var(--pbp-brand-muted)] bg-[var(--pbp-surface-selected)] text-[var(--pbp-brand-primary)]",
  info: "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-status-info-fg)]",
  success: "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]",
  warning: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
  inverse: "border-white/20 bg-white/10 text-[var(--pbp-text-inverse)]",
};

export const adminSurfaceVariantClassNames: Record<AdminSurfaceVariant, string> = {
  base: "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text)]",
  soft: "border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] text-[var(--pbp-text-secondary)]",
  selected: "border-[var(--pbp-brand-muted)] bg-[var(--pbp-surface-selected)] text-[var(--pbp-brand-primary)]",
  warning: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)] text-[var(--pbp-status-danger-fg)]",
};

export function joinAdminClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

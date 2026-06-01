import type { ReactNode } from "react";

import { joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";

export type AdminFeedbackTone = "neutral" | "success" | "warning" | "danger";

type AdminFeedbackMessageProps = {
  title?: string;
  message: ReactNode;
  tone?: AdminFeedbackTone;
  className?: string;
};

const toneClassNames: Record<AdminFeedbackTone, string> = {
  neutral: "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-secondary)]",
  success: "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]",
  warning: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)] text-[var(--pbp-status-warning-fg)]",
  danger: "border-[var(--pbp-action-danger-soft-border)] bg-[var(--pbp-action-danger-soft-surface)] text-[var(--pbp-action-danger-soft-text)]",
};

export function AdminFeedbackMessage({
  title,
  message,
  tone = "neutral",
  className = "",
}: AdminFeedbackMessageProps) {
  return (
    <div
      className={joinAdminClassNames(
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        toneClassNames[tone],
        className,
      )}
    >
      {title ? <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-80">{title}</p> : null}
      <div className={joinAdminClassNames(title ? "mt-1" : "", "font-semibold")}>{message}</div>
    </div>
  );
}

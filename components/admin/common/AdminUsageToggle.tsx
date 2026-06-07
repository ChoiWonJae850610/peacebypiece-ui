"use client";

import StatusToggle from "@/components/common/StatusToggle";

type AdminUsageToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (nextValue: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  variant?: "card" | "inline";
  className?: string;
};

export default function AdminUsageToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  readOnly = false,
  activeLabel = "사용",
  inactiveLabel = "미사용",
  variant = "card",
  className = "",
}: AdminUsageToggleProps) {
  const statusLabel = checked ? activeLabel : inactiveLabel;

  if (variant === "inline") {
    return (
      <div className={["inline-flex shrink-0 items-center gap-2", className].join(" ")}>
        <span
          className={[
            "min-w-[52px] text-right text-xs font-bold",
            checked ? "text-[var(--pbp-text-primary)]" : "text-[var(--pbp-text-muted)]",
          ].join(" ")}
        >
          {statusLabel}
        </span>
        <StatusToggle checked={checked} onChange={readOnly ? undefined : onChange} disabled={disabled || readOnly} srLabel={label} size="sm" />
      </div>
    );
  }

  return (
    <div className={["rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3", className].join(" ") }>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--pbp-text-primary)]">{label}</p>
          {description ? <p className="mt-1 text-xs font-semibold leading-5 text-[var(--pbp-text-muted)]">{description}</p> : null}
          <p className={["mt-1 text-xs font-semibold", checked ? "text-[var(--pbp-text-primary)]" : "text-[var(--pbp-text-muted)]"].join(" ")}>{statusLabel}</p>
        </div>
        <StatusToggle checked={checked} onChange={readOnly ? undefined : onChange} disabled={disabled} srLabel={label} size="sm" />
      </div>
    </div>
  );
}

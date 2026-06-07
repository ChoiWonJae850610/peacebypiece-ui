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
    if (readOnly) {
      return (
        <div className={["inline-flex shrink-0 items-center gap-2", className].join(" ")}>
          <span className={["min-w-[42px] text-right text-xs font-semibold", checked ? "text-[var(--pbp-brand-primary)]" : "text-[var(--pbp-text-muted)]"].join(" ")}>{statusLabel}</span>
          <span
            aria-label={label}
            aria-checked={checked}
            role="switch"
            className={[
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ease-out",
              checked ? "pbp-toggle-track-on" : "pbp-toggle-track-off",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "pointer-events-none absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow-sm transition-transform duration-200 ease-out pbp-toggle-thumb",
                checked ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </span>
        </div>
      );
    }

    return (
      <div className={["inline-flex shrink-0 items-center gap-2", className].join(" ")}>
        <span className={["min-w-[42px] text-right text-xs font-semibold", checked ? "text-[var(--pbp-brand-primary)]" : "text-[var(--pbp-text-muted)]"].join(" ")}>{statusLabel}</span>
        <StatusToggle checked={checked} onChange={readOnly ? undefined : onChange} disabled={disabled} srLabel={label} size="sm" />
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

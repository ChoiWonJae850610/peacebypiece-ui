"use client";

import type { ReactNode } from "react";

type WaflNoticeBoxTone = "neutral" | "info" | "warning";

type WaflNoticeBoxProps = {
  children: ReactNode;
  tone?: WaflNoticeBoxTone;
  className?: string;
};

const TONE_CLASS: Record<WaflNoticeBoxTone, string> = {
  neutral:
    "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]",
  info:
    "border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] text-[var(--pbp-text-muted)]",
  warning:
    "border-[var(--pbp-status-warning)] bg-[var(--pbp-status-warning-soft)] text-[var(--pbp-status-warning)]",
};

export default function WaflNoticeBox({
  children,
  tone = "info",
  className = "",
}: WaflNoticeBoxProps) {
  return (
    <div
      data-wafl-component="notice-box"
      className={[
        "rounded-2xl border px-4 py-3 text-xs font-medium leading-5",
        TONE_CLASS[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

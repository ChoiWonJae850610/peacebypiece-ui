"use client";

import type { ReactNode } from "react";
import WaflNoticeBox from "@/components/admin/common/WaflNoticeBox";

export type WaflSettingsSectionGroupTone = "neutral" | "info" | "warning" | "danger" | "success";

type WaflSettingsSectionGroupProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
  tone?: WaflSettingsSectionGroupTone;
  className?: string;
};

function joinClassNames(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const TONE_CLASS: Record<WaflSettingsSectionGroupTone, string> = {
  neutral: "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)]/60",
  info: "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-status-info-bg)]/35",
  warning: "border-[var(--pbp-status-warning-bg)] bg-[var(--pbp-status-warning-bg)]/30",
  danger: "border-[var(--pbp-status-danger-bg)] bg-[var(--pbp-status-danger-bg)]/25",
  success: "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)]/28",
};

export default function WaflSettingsSectionGroup({
  eyebrow,
  title,
  description,
  badge,
  children,
  aside,
  footer,
  tone = "neutral",
  className = "",
}: WaflSettingsSectionGroupProps) {
  return (
    <section className={joinClassNames("rounded-[28px] border p-4 sm:p-5", TONE_CLASS[tone], className)}>
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pbp-text-subtle)]">{eyebrow}</p> : null}
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="text-base font-black tracking-[-0.03em] text-[var(--pbp-text-primary)]">{title}</h3>
            {badge ? <span className="shrink-0">{badge}</span> : null}
          </div>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--pbp-text-muted)]">{description}</p> : null}
        </div>
        {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">{aside}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
      {footer ? (
        <WaflNoticeBox tone="neutral" className="mt-4 rounded-[22px]">
          {footer}
        </WaflNoticeBox>
      ) : null}
    </section>
  );
}

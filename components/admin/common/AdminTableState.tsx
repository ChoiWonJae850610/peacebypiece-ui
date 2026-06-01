import type { ReactNode } from "react";

import { joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";

export type AdminTableStateTone = "neutral" | "danger";

type AdminTableStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: AdminTableStateTone;
  className?: string;
  minHeightClassName?: string;
};

const toneClassNames: Record<AdminTableStateTone, string> = {
  neutral: "text-[var(--pbp-text-muted)]",
  danger: "text-[var(--pbp-danger-text)]",
};

export function AdminTableState({
  title,
  description,
  action,
  tone = "neutral",
  className = "",
  minHeightClassName = "min-h-[240px]",
}: AdminTableStateProps) {
  return (
    <div
      className={joinAdminClassNames(
        "flex items-center justify-center bg-[var(--pbp-surface)] px-4 py-10 text-center text-sm",
        minHeightClassName,
        toneClassNames[tone],
        className,
      )}
    >
      <div className="max-w-md">
        <p className="font-semibold">{title}</p>
        {description ? <p className="mt-1 text-xs leading-5 opacity-90">{description}</p> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

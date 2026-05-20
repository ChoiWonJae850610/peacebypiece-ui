import type { ReactNode } from "react";
import { adminSurfaceVariantClassNames, joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";

type AdminEmptyStateTone = "neutral" | "danger" | "warning";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: AdminEmptyStateTone;
  className?: string;
};

const toneClassNames: Record<AdminEmptyStateTone, string> = {
  neutral: adminSurfaceVariantClassNames.base,
  danger: adminSurfaceVariantClassNames.danger,
  warning: adminSurfaceVariantClassNames.warning,
};

export function AdminEmptyState({ title, description, action, tone = "neutral", className = "" }: AdminEmptyStateProps) {
  return (
    <section className={joinAdminClassNames("rounded-[28px] border p-5 shadow-[var(--pbp-shadow-card)]", toneClassNames[tone], className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description ? <p className="mt-1 text-xs leading-5 opacity-80">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

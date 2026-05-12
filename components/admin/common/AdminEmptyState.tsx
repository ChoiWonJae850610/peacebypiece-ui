import type { ReactNode } from "react";

type AdminEmptyStateTone = "neutral" | "danger" | "warning";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: AdminEmptyStateTone;
  className?: string;
};

const toneClassNames: Record<AdminEmptyStateTone, string> = {
  neutral: "border-stone-200 bg-white text-stone-600",
  danger: "border-red-100 bg-red-50 text-red-700",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
};

export function AdminEmptyState({ title, description, action, tone = "neutral", className = "" }: AdminEmptyStateProps) {
  return (
    <section className={`rounded-[28px] border p-5 shadow-sm ${toneClassNames[tone]} ${className}`}>
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

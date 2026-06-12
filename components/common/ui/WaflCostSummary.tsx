import type { ReactNode } from "react";

import { WaflSurface } from "@/components/common/ui/WaflSurface";
import { cn } from "@/lib/utils";

export function WaflCostSummaryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-2 sm:grid-cols-3", className)}>{children}</div>;
}

export function WaflCostSummaryCard({
  label,
  value,
  emphasize = false,
  className,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  className?: string;
}) {
  return (
    <WaflSurface
      component="cost-summary-card"
      shape="control"
      tone={emphasize ? "info" : "muted"}
      className={cn("min-w-0 px-3 py-2.5", emphasize ? "pbp-cost-grand-total" : "", className)}
    >
      <p className="text-[11px] font-semibold pbp-text-subtle">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold tabular-nums", emphasize ? "pbp-text-primary" : "pbp-text-muted")}>
        {value}
      </p>
    </WaflSurface>
  );
}

export function WaflCostSummaryRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-1.5">
      <span className="shrink-0 text-[11px] font-semibold pbp-text-subtle">{label}</span>
      <span className={cn("truncate text-xs font-semibold tabular-nums", emphasize ? "pbp-text-primary" : "pbp-text-muted")}>{value}</span>
    </div>
  );
}

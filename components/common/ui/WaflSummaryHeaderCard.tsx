import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { WaflSurface } from "./WaflSurface";

type WaflSummaryHeaderCardProps = {
  title: ReactNode;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  columns?: 2 | 3;
  component?: string;
  className?: string;
};

export default function WaflSummaryHeaderCard({
  title,
  children,
  footerLeft,
  footerRight,
  columns = 3,
  component = "summary-header-card",
  className,
}: WaflSummaryHeaderCardProps) {
  return (
    <WaflSurface
      as="section"
      component={component}
      className={cn("shrink-0 p-3.5 sm:p-4", className)}
    >
      <div className="min-w-0 text-center">{title}</div>
      <div
        className={cn(
          "mt-3 grid min-w-0 gap-3 border-t border-[var(--pbp-border)] pt-3 text-center",
          columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {children}
      </div>
      {footerLeft || footerRight ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">{footerLeft}</div>
          <div className="min-w-0 sm:text-right">{footerRight}</div>
        </div>
      ) : null}
    </WaflSurface>
  );
}

export function WaflSummaryInfoCell({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 text-center", className)}>
      <span className="block truncate text-[11px] font-medium pbp-text-subtle">{label}</span>
      <div className="mt-1 min-w-0 text-sm font-semibold pbp-text-primary">{children}</div>
    </div>
  );
}

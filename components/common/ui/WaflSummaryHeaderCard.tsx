import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { WaflSurface } from "./WaflSurface";
import WaflResponsiveSummaryGrid from "./WaflResponsiveSummaryGrid";

type WaflSummaryHeaderCardProps = {
  title: ReactNode;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerCenter?: ReactNode;
  footerRight?: ReactNode;
  columns?: 1 | 2 | 3;
  responsiveColumns?: boolean;
  footerColumns?: 2 | 3;
  component?: string;
  className?: string;
};

export default function WaflSummaryHeaderCard({
  title,
  children,
  footerLeft,
  footerCenter,
  footerRight,
  columns = 3,
  responsiveColumns = false,
  footerColumns = 3,
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
      <WaflResponsiveSummaryGrid
        columns={columns}
        responsive={responsiveColumns}
        className="mt-3 border-t border-[var(--pbp-border)] pt-3 text-center"
      >
        {children}
      </WaflResponsiveSummaryGrid>
      {footerLeft || footerCenter || footerRight ? (
        <div
          className={cn(
            "mt-3 grid min-w-0 gap-3 text-center",
            footerColumns === 2 ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          <div className="min-w-0">{footerLeft}</div>
          {footerColumns === 3 ? <div className="min-w-0">{footerCenter}</div> : null}
          <div className="min-w-0">{footerRight}</div>
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

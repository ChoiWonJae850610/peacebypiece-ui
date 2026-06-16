import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WaflResponsiveSummaryGridProps = {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  responsive?: boolean;
  className?: string;
};

export default function WaflResponsiveSummaryGrid({
  children,
  columns = 2,
  responsive = false,
  className,
}: WaflResponsiveSummaryGridProps) {
  const gridClass = responsive
    ? columns === 3
      ? "grid-cols-1 min-[600px]:grid-cols-2 lg:grid-cols-3"
      : columns === 2
        ? "grid-cols-1 min-[600px]:grid-cols-2"
        : "grid-cols-1"
    : columns === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : columns === 2
        ? "grid-cols-2"
        : "grid-cols-1";

  return (
    <div className={cn("grid min-w-0 gap-3", gridClass, className)}>
      {children}
    </div>
  );
}

import type { ReactNode } from "react";

import { RESPONSIVE_STYLE_CLASSES } from "@/lib/responsive/responsiveLayoutPolicy";
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
      ? RESPONSIVE_STYLE_CLASSES.summaryGridThreeColumns
      : columns === 2
        ? RESPONSIVE_STYLE_CLASSES.summaryGridTwoColumns
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

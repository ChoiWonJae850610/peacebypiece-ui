import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type WaflMobileDetailContentProps = HTMLAttributes<HTMLDivElement>;

export default function WaflMobileDetailContent({
  className,
  children,
  ...props
}: WaflMobileDetailContentProps) {
  return (
    <div
      data-wafl-component="mobile-detail-content"
      className={cn(
        "min-h-full w-full min-w-0 overflow-x-hidden wafl-shape-surface border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-3 shadow-none sm:p-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

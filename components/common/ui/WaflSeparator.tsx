import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type WaflSeparatorProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

export default function WaflSeparator({ orientation = "horizontal", className, ...props }: WaflSeparatorProps) {
  return (
    <div
      data-wafl-component="separator"
      aria-hidden="true"
      className={cn(
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        "bg-[var(--pbp-border)]",
        className,
      )}
      {...props}
    />
  );
}

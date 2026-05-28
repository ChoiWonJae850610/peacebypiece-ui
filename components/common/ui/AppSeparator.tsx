import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AppSeparatorProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
};

export default function AppSeparator({ orientation = "horizontal", className, ...props }: AppSeparatorProps) {
  return (
    <div
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

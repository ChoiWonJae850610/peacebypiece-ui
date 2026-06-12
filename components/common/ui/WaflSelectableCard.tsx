import type { HTMLAttributes, ReactNode } from "react";

import { WaflSurface } from "@/components/common/ui/WaflSurface";
import { cn } from "@/lib/utils";

export function WaflSelectableCard({
  selected,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <WaflSurface
      as="article"
      component="selectable-card"
      shape="control"
      tone={selected ? "selected" : "muted"}
      data-wafl-state={selected ? "selected" : "normal"}
      className={cn("pbp-interactive-card w-full transition-all duration-150", className)}
      {...props}
    >
      {children}
    </WaflSurface>
  );
}

import type { HTMLAttributes, ReactNode } from "react";

import { WaflSurface } from "@/components/common/ui/WaflSurface";
import { cn } from "@/lib/utils";

export function WaflSelectableCard({
  selected,
  current = false,
  children,
  className,
  component = "selectable-card",
  disabled = false,
  ...props
}: HTMLAttributes<HTMLElement> & {
  selected?: boolean;
  current?: boolean;
  children: ReactNode;
  component?: string;
  disabled?: boolean;
}) {
  return (
    <WaflSurface
      as="article"
      component={component}
      shape="control"
      tone={selected ? "selected" : current ? "muted" : "surface"}
      data-wafl-state={selected ? "selected" : current ? "current" : "normal"}
      data-disabled={disabled ? "true" : undefined}
      aria-disabled={disabled || undefined}
      className={cn("pbp-interactive-card w-full transition-all duration-150 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50", className)}
      {...props}
    >
      {children}
    </WaflSurface>
  );
}

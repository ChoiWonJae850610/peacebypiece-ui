import type { HTMLAttributes } from "react";

import { WAFL_WORKSPACE_PANEL_PADDING_CLASS } from "@/components/common/ui/waflWorkspaceSpacing";
import { cn } from "@/lib/utils";

export const WAFL_SIDE_PANEL_STACK_CLASS = "flex min-h-0 flex-col gap-3";

export default function WaflSidePanelShell({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-wafl-component="side-panel-shell"
      className={cn(
        "h-full min-h-0 w-full",
        WAFL_WORKSPACE_PANEL_PADDING_CLASS,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

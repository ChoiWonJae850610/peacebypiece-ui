import type { HTMLAttributes } from "react";

import { WAFL_WORKSPACE_PANEL_PADDING_CLASS } from "@/components/common/ui/waflWorkspaceSpacing";
import { cn } from "@/lib/utils";

export default function WaflSidePanelShell({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-wafl-component="side-panel-shell"
      className={cn(
        "min-h-full w-full",
        WAFL_WORKSPACE_PANEL_PADDING_CLASS,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

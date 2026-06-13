import type { HTMLAttributes } from "react";

import {
  WAFL_WORKSPACE_PANEL_PADDING_CLASS,
  WAFL_WORKSPACE_SECTION_GAP_CLASS,
} from "@/components/common/ui/waflWorkspaceSpacing";
import { cn } from "@/lib/utils";

export const WAFL_PANEL_CONTENT_STACK_CLASS = cn(
  "flex min-h-0 w-full flex-col",
  WAFL_WORKSPACE_SECTION_GAP_CLASS,
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
);

export default function WaflPanelContentShell({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-wafl-component="panel-content-shell"
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

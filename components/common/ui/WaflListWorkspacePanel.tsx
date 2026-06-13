import type { HTMLAttributes, ReactNode } from "react";

import WaflWorkspacePanel from "@/components/common/ui/WaflWorkspacePanel";
import { cn } from "@/lib/utils";

export default function WaflListWorkspacePanel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <WaflWorkspacePanel
      as="aside"
      panelRole="sidebar"
      data-wafl-component="list-workspace-panel"
      className={cn("flex h-full min-h-0 min-w-0 overflow-hidden", className)}
      {...props}
    >
      {children}
    </WaflWorkspacePanel>
  );
}

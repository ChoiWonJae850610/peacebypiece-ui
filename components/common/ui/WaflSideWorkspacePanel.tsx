import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import WaflSidePanelShell from "@/components/common/ui/WaflSidePanelShell";
import WaflWorkspacePanel from "@/components/common/ui/WaflWorkspacePanel";
import { cn } from "@/lib/utils";

const WaflSideWorkspacePanel = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { children: ReactNode }>(
  function WaflSideWorkspacePanel({ className, children, ...props }, ref) {
    return (
      <WaflWorkspacePanel
        ref={ref}
        as="aside"
        panelRole="side"
        data-wafl-component="side-workspace-panel"
        className={cn(
          "flex h-full min-h-0 min-w-0 touch-pan-y flex-col overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]",
          className,
        )}
        {...props}
      >
        <WaflSidePanelShell>{children}</WaflSidePanelShell>
      </WaflWorkspacePanel>
    );
  },
);

export default WaflSideWorkspacePanel;

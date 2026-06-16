import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import WaflWorkspacePanel from "@/components/common/ui/WaflWorkspacePanel";
import { cn } from "@/lib/utils";

const WaflDetailWorkspacePanel = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & { children: ReactNode }>(
  function WaflDetailWorkspacePanel({ className, children, ...props }, ref) {
    return (
      <WaflWorkspacePanel
        ref={ref}
        as="section"
        panelRole="detail"
        data-wafl-component="detail-workspace-panel"
        className={cn(
          "flex h-full min-h-0 min-w-0 touch-pan-y flex-col overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]",
          className,
        )}
        {...props}
      >
        {children}
      </WaflWorkspacePanel>
    );
  },
);

export default WaflDetailWorkspacePanel;

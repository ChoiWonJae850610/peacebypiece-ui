import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import WaflPanelContentShell from "./WaflPanelContentShell";
import { WaflStateBlock, type WaflStateKind, type WaflStateSize } from "./WaflState";

export type WaflWorkspaceStateLayout = "workspace" | "panel" | "inline";

export type WaflWorkspaceStatePanelProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  kind?: WaflStateKind;
  layout?: WaflWorkspaceStateLayout;
  withContentShell?: boolean;
  className?: string;
  stateClassName?: string;
};

const layoutMinHeightClassMap: Record<WaflWorkspaceStateLayout, string> = {
  workspace: "min-h-full flex-1",
  panel: "min-h-[132px]",
  inline: "min-h-[96px]",
};

const layoutSizeMap: Record<WaflWorkspaceStateLayout, WaflStateSize> = {
  workspace: "lg",
  panel: "sm",
  inline: "sm",
};

export default function WaflWorkspaceStatePanel({
  title,
  description,
  action,
  kind = "empty",
  layout = "workspace",
  withContentShell = false,
  className,
  stateClassName,
}: WaflWorkspaceStatePanelProps) {
  const state = (
    <WaflStateBlock
      title={title}
      description={description}
      action={action}
      kind={kind}
      size={layoutSizeMap[layout]}
      minHeightClassName={layoutMinHeightClassMap[layout]}
      className={cn(
        "border-dashed border-[var(--pbp-empty-state-border)] bg-[var(--pbp-empty-state-surface)]",
        stateClassName,
      )}
    />
  );

  if (!withContentShell) {
    return (
      <div
        data-wafl-component="workspace-state-panel"
        data-wafl-state-kind={kind}
        data-wafl-state-layout={layout}
        className={cn(
          layout === "workspace" ? "flex min-h-full w-full flex-1 flex-col" : "w-full",
          className,
        )}
      >
        {state}
      </div>
    );
  }

  return (
    <WaflPanelContentShell
      data-wafl-component="workspace-state-panel"
      data-wafl-state-kind={kind}
      data-wafl-state-layout={layout}
      className={cn("box-border flex min-h-full flex-col", className)}
    >
      {state}
    </WaflPanelContentShell>
  );
}

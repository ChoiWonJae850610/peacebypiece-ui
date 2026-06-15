import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { WaflEmptyWorkspaceState, type WaflEmptyWorkspaceStateVariant } from "./WaflEmptyWorkspaceState";
import WaflPanelContentShell from "./WaflPanelContentShell";
import type { WaflStateKind } from "./WaflState";

type WaflWorkspaceEmptyPanelProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: WaflEmptyWorkspaceStateVariant;
  kind?: WaflStateKind;
  className?: string;
  stateClassName?: string;
  withContentShell?: boolean;
};

export default function WaflWorkspaceEmptyPanel({
  title,
  description,
  action,
  variant = "center-panel",
  kind = "empty",
  className,
  stateClassName,
  withContentShell = true,
}: WaflWorkspaceEmptyPanelProps) {
  const state = (
    <WaflEmptyWorkspaceState
      title={title}
      description={description}
      action={action}
      variant={variant}
      kind={kind}
      className={cn("min-h-full flex-1", stateClassName)}
    />
  );

  if (!withContentShell) {
    return (
      <div
        data-wafl-component="workspace-empty-panel"
        className={cn("flex min-h-full w-full flex-1 flex-col", className)}
      >
        {state}
      </div>
    );
  }

  return (
    <WaflPanelContentShell
      data-wafl-component="workspace-empty-panel"
      className={cn("box-border flex min-h-full flex-col !p-4", className)}
    >
      {state}
    </WaflPanelContentShell>
  );
}

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
};

export default function WaflWorkspaceEmptyPanel({
  title,
  description,
  action,
  variant = "center-panel",
  kind = "empty",
  className,
  stateClassName,
}: WaflWorkspaceEmptyPanelProps) {
  return (
    <WaflPanelContentShell
      data-wafl-component="workspace-empty-panel"
      className={cn("flex min-h-full flex-col", className)}
    >
      <WaflEmptyWorkspaceState
        title={title}
        description={description}
        action={action}
        variant={variant}
        kind={kind}
        className={cn("min-h-full flex-1", stateClassName)}
      />
    </WaflPanelContentShell>
  );
}

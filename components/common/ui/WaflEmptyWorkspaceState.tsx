import type { ReactNode } from "react";

import type { WaflStateKind } from "./WaflState";
import WaflWorkspaceStatePanel, { type WaflWorkspaceStateLayout } from "./WaflWorkspaceStatePanel";

export type WaflEmptyWorkspaceStateVariant = "center-panel" | "side-panel" | "inline-section";

export type WaflEmptyWorkspaceStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: WaflEmptyWorkspaceStateVariant;
  kind?: WaflStateKind;
  className?: string;
};

function resolveLayout(variant: WaflEmptyWorkspaceStateVariant): WaflWorkspaceStateLayout {
  if (variant === "inline-section") return "inline";
  return "panel";
}

export function WaflEmptyWorkspaceState({
  title,
  description,
  action,
  variant = "center-panel",
  kind = "empty",
  className,
}: WaflEmptyWorkspaceStateProps) {
  return (
    <WaflWorkspaceStatePanel
      title={title}
      description={description}
      action={action}
      kind={kind}
      layout={resolveLayout(variant)}
      stateClassName={className}
    />
  );
}

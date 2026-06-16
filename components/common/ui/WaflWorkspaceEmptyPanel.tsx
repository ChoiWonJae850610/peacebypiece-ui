import type { ReactNode } from "react";

import type { WaflEmptyWorkspaceStateVariant } from "./WaflEmptyWorkspaceState";
import type { WaflStateKind } from "./WaflState";
import WaflWorkspaceStatePanel, { type WaflWorkspaceStateLayout } from "./WaflWorkspaceStatePanel";

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

function resolveLayout(variant: WaflEmptyWorkspaceStateVariant): WaflWorkspaceStateLayout {
  return variant === "inline-section" ? "inline" : "workspace";
}

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
  return (
    <WaflWorkspaceStatePanel
      title={title}
      description={description}
      action={action}
      kind={kind}
      layout={resolveLayout(variant)}
      withContentShell={withContentShell}
      className={className}
      stateClassName={stateClassName}
    />
  );
}

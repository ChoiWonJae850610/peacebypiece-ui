"use client";

import { WaflEmptyWorkspaceState, WaflWorkspaceEmptyPanel } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type WorkOrderEmptyStateProps = {
  variant?: "workspace" | "detail" | "side";
  panel?: boolean;
};

export default function WorkOrderEmptyState({ variant = "workspace", panel = false }: WorkOrderEmptyStateProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.emptyWorkspace;
  const title = variant === "detail" ? copy.detailTitle : variant === "side" ? copy.sideTitle : copy.title;
  const description = variant === "detail" ? copy.detailDescription : variant === "side" ? copy.sideDescription : copy.description;

  const stateVariant = variant === "side" ? "side-panel" : "center-panel";

  if (panel) {
    return (
      <WaflWorkspaceEmptyPanel
        title={title}
        description={description}
        variant={stateVariant}
        withContentShell={variant !== "side"}
      />
    );
  }

  return (
    <WaflEmptyWorkspaceState
      title={title}
      description={description}
      variant={stateVariant}
    />
  );
}

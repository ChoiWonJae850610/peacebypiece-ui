"use client";

import { WaflEmptyWorkspaceState } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type WorkOrderEmptyStateProps = {
  variant?: "workspace" | "detail" | "side";
};

export default function WorkOrderEmptyState({ variant = "workspace" }: WorkOrderEmptyStateProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.emptyWorkspace;
  const title = variant === "detail" ? copy.detailTitle : variant === "side" ? copy.sideTitle : copy.title;
  const description = variant === "detail" ? copy.detailDescription : variant === "side" ? copy.sideDescription : copy.description;

  return (
    <WaflEmptyWorkspaceState
      title={title}
      description={description}
      variant={variant === "side" ? "side-panel" : "center-panel"}
    />
  );
}

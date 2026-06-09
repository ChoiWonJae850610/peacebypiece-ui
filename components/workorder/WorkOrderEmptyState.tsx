"use client";

import { WaflStateBlock } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";

type WorkOrderEmptyStateProps = {
  variant?: "workspace" | "detail" | "side";
};

export default function WorkOrderEmptyState({ variant = "workspace" }: WorkOrderEmptyStateProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.emptyWorkspace;
  const title = variant === "detail" ? copy.detailTitle : variant === "side" ? copy.sideTitle : copy.title;
  const description = variant === "detail" ? copy.detailDescription : variant === "side" ? copy.sideDescription : copy.description;
  const isSide = variant === "side";

  return (
    <WaflStateBlock
      title={title}
      description={description}
      kind="empty"
      size={isSide ? "sm" : "lg"}
      minHeightClassName={isSide ? "min-h-[260px]" : "min-h-[360px] md:min-h-[520px]"}
      className="border-dashed"
    />
  );
}

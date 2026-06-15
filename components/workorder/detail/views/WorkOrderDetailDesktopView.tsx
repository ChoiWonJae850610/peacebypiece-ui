import { WaflPanelContentShell } from "@/components/common/ui";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import WorkOrderDetailDesktopSections from "@/components/workorder/detail/views/WorkOrderDetailDesktopSections";
import type { WorkOrderDetailViewProps } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailDesktopView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: WorkOrderDetailViewProps) {
  return (
    <WaflPanelContentShell>
      <WorkOrderDetailDesktopSections viewModel={viewModel} />
      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </WaflPanelContentShell>
  );
}

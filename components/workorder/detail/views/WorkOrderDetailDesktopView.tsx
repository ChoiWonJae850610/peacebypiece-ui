import DesktopWorkspaceLayout from "@/components/workorder/detail/layout/DesktopWorkspaceLayout";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import WorkOrderDetailDesktopSections from "@/components/workorder/detail/views/WorkOrderDetailDesktopSections";
import type { WorkOrderDetailViewProps } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailDesktopView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: WorkOrderDetailViewProps) {
  return (
    <DesktopWorkspaceLayout>
      <WorkOrderDetailDesktopSections viewModel={viewModel} />
      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </DesktopWorkspaceLayout>
  );
}

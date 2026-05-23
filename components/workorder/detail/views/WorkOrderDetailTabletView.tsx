import TabletSplitLayout from "@/components/workorder/detail/layout/TabletSplitLayout";
import RejectionReasonNotice from "@/components/workorder/detail/RejectionReasonNotice";
import WorkOrderDetailTabletCostSummarySection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletCostSummarySection";
import WorkOrderDetailTabletActionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection";
import WorkOrderDetailTabletHeaderSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletHeaderSection";
import WorkOrderDetailTabletOrderInfoSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection";
import WorkOrderDetailTabletProductionCompositionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletProductionCompositionSection";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import type { WorkOrderDetailViewProps } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailTabletView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: WorkOrderDetailViewProps) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <TabletSplitLayout>
        <WorkOrderDetailTabletHeaderSection {...viewModel.headerProps} />
        {viewModel.rejectionReasonNoticeProps ? <RejectionReasonNotice {...viewModel.rejectionReasonNoticeProps} /> : null}
        <WorkOrderDetailTabletActionSection {...viewModel.actionProps} />
        <WorkOrderDetailTabletOrderInfoSection {...viewModel.orderInfoProps} />
        {viewModel.showCostSummary ? <WorkOrderDetailTabletCostSummarySection {...viewModel.costSummaryProps} /> : null}
        {viewModel.showProductionComposition ? <WorkOrderDetailTabletProductionCompositionSection {...viewModel.productionCompositionProps} /> : null}
      </TabletSplitLayout>

      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </div>
  );
}

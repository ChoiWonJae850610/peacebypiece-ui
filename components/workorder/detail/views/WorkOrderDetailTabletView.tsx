import TabletSplitLayout from "@/components/workorder/detail/layout/TabletSplitLayout";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderDetailTabletActionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection";
import WorkOrderDetailTabletHeaderSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletHeaderSection";
import WorkOrderDetailTabletOrderInfoSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection";
import WorkOrderDetailTabletProductionCompositionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailTabletProductionCompositionSection";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import type { ReturnTypeBuildWorkOrderDetailViewModel, ReturnTypeUseWorkOrderDetailEditor } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailTabletView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: {
  viewModel: ReturnTypeBuildWorkOrderDetailViewModel;
  editor: ReturnTypeUseWorkOrderDetailEditor;
  currentInventoryQuantity: number;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <TabletSplitLayout>
        <WorkOrderDetailTabletHeaderSection {...viewModel.headerProps} />
        <WorkOrderDetailTabletActionSection {...viewModel.actionProps} />
        <WorkOrderDetailTabletOrderInfoSection {...viewModel.orderInfoProps} />
        {viewModel.showCostSummary ? <WorkOrderCostSummarySection {...viewModel.costSummaryProps} /> : null}
        {viewModel.showProductionComposition ? <WorkOrderDetailTabletProductionCompositionSection {...viewModel.productionCompositionProps} /> : null}
      </TabletSplitLayout>

      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </div>
  );
}

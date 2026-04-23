import MobileSectionStack from "@/components/workorder/detail/layout/MobileSectionStack";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderDetailMobileActionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection";
import WorkOrderDetailMobileHeaderSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileHeaderSection";
import WorkOrderDetailMobileOrderInfoSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection";
import WorkOrderDetailMobileProductionCompositionSection from "@/components/workorder/detail/sections/device/WorkOrderDetailMobileProductionCompositionSection";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import type { ReturnTypeBuildWorkOrderDetailViewModel, ReturnTypeUseWorkOrderDetailEditor } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailMobileView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: {
  viewModel: ReturnTypeBuildWorkOrderDetailViewModel;
  editor: ReturnTypeUseWorkOrderDetailEditor;
  currentInventoryQuantity: number;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <MobileSectionStack>
        <WorkOrderDetailMobileHeaderSection {...viewModel.headerProps} />
        <WorkOrderDetailMobileActionSection {...viewModel.actionProps} />
        {viewModel.showCostSummary ? <WorkOrderCostSummarySection {...viewModel.costSummaryProps} /> : null}
        <WorkOrderDetailMobileOrderInfoSection {...viewModel.orderInfoProps} />
        {viewModel.showProductionComposition ? <WorkOrderDetailMobileProductionCompositionSection {...viewModel.productionCompositionProps} /> : null}
      </MobileSectionStack>

      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </div>
  );
}

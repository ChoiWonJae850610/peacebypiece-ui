import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import DesktopWorkspaceLayout from "@/components/workorder/detail/layout/DesktopWorkspaceLayout";
import WorkOrderDetailSharedModals from "@/components/workorder/detail/shared/WorkOrderDetailSharedModals";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import type { ReturnTypeUseWorkOrderDetailEditor } from "@/components/workorder/detail/views/detailViewTypes";
import type { ReturnTypeBuildWorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

export default function WorkOrderDetailDesktopView({
  viewModel,
  editor,
  currentInventoryQuantity,
}: {
  viewModel: ReturnTypeBuildWorkOrderDetailViewModel;
  editor: ReturnTypeUseWorkOrderDetailEditor;
  currentInventoryQuantity: number;
}) {
  return (
    <DesktopWorkspaceLayout>
      <WorkOrderHeaderSection {...viewModel.headerProps} />

      <WorkOrderActionSection {...viewModel.actionProps} />

      {viewModel.showCostSummary ? (
        <div className="mt-6">
          <WorkOrderCostSummarySection {...viewModel.costSummaryProps} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6">
        <OrderInfoSection {...viewModel.orderInfoProps} />

        {viewModel.showProductionComposition ? <ProductionCompositionSection {...viewModel.productionCompositionProps} /> : null}
      </div>
      <WorkOrderDetailSharedModals editor={editor} currentInventoryQuantity={currentInventoryQuantity} />
    </DesktopWorkspaceLayout>
  );
}

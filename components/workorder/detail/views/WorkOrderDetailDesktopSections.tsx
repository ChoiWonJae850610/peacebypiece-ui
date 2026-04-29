import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type WorkOrderDetailDesktopSectionsProps = {
  viewModel: WorkOrderDetailViewModel;
};

export default function WorkOrderDetailDesktopSections({ viewModel }: WorkOrderDetailDesktopSectionsProps) {
  return (
    <>
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
    </>
  );
}

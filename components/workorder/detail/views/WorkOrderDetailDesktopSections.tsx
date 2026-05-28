import { useI18n } from "@/lib/i18n";
import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import RejectionReasonNotice from "@/components/workorder/detail/RejectionReasonNotice";
import DetailSectionGroup from "@/components/workorder/detail/shared/DetailSectionGroup";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type WorkOrderDetailDesktopSectionsProps = {
  viewModel: WorkOrderDetailViewModel;
};

export default function WorkOrderDetailDesktopSections({ viewModel }: WorkOrderDetailDesktopSectionsProps) {
  const { i18n } = useI18n();
  const groups = i18n.workorder.ui.detailGroups;

  return (
    <>
      <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white px-5 py-5 shadow-sm">
        <WorkOrderHeaderSection {...viewModel.headerProps} />

        {viewModel.rejectionReasonNoticeProps ? <div className="mt-4"><RejectionReasonNotice {...viewModel.rejectionReasonNoticeProps} /></div> : null}

        <WorkOrderActionSection {...viewModel.actionProps} />
      </div>

      {viewModel.showCostSummary ? (
        <DetailSectionGroup eyebrow={groups.cost.eyebrow} title={groups.cost.title} description={groups.cost.description}>
          <WorkOrderCostSummarySection {...viewModel.costSummaryProps} />
        </DetailSectionGroup>
      ) : null}

      <DetailSectionGroup eyebrow={groups.order.eyebrow} title={groups.order.title} description={groups.order.description}>
        <OrderInfoSection {...viewModel.orderInfoProps} />
      </DetailSectionGroup>

      {viewModel.showProductionComposition ? (
        <DetailSectionGroup eyebrow={groups.production.eyebrow} title={groups.production.title} description={groups.production.description}>
          <ProductionCompositionSection {...viewModel.productionCompositionProps} />
        </DetailSectionGroup>
      ) : null}
    </>
  );
}

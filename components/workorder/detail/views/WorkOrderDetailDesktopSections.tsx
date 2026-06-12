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

export default function WorkOrderDetailDesktopSections({
  viewModel,
}: WorkOrderDetailDesktopSectionsProps) {
  const { i18n } = useI18n();
  const groups = i18n.workorder.ui.detailGroups;

  return (
    <>
      <div className="overflow-hidden rounded-[var(--pbp-radius-wafl)] border border-transparent bg-transparent px-5 py-5">
        <WorkOrderHeaderSection {...viewModel.headerProps} />

        {viewModel.rejectionReasonNoticeProps ? (
          <div className="mt-4">
            <RejectionReasonNotice {...viewModel.rejectionReasonNoticeProps} />
          </div>
        ) : null}

        <WorkOrderActionSection {...viewModel.actionProps} />
      </div>

      <div className="px-5">
        <DetailSectionGroup
          eyebrow={groups.cost.eyebrow}
          title={groups.cost.title}
          description={groups.cost.description}
        >
          <WorkOrderCostSummarySection {...viewModel.costSummaryProps} />
        </DetailSectionGroup>

        <OrderInfoSection {...viewModel.orderInfoProps} />

        {viewModel.showProductionComposition ? (
          <ProductionCompositionSection
            {...viewModel.productionCompositionProps}
          />
        ) : null}
      </div>
    </>
  );
}

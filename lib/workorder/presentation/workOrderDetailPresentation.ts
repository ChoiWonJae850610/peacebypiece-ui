import {
  buildActionSectionProps,
  buildCostSummarySectionProps,
  buildHeaderSectionProps,
  buildRejectionReasonNoticeProps,
  buildOrderInfoSectionProps,
  buildProductionCompositionSectionProps,
  type BuildWorkOrderDetailViewModelArgs,
  type WorkOrderDetailViewModel,
} from "@/lib/workorder/presentation/workOrderDetailSectionProps";
import { deriveOrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";

export function buildWorkOrderDetailViewModel(args: BuildWorkOrderDetailViewModelArgs): WorkOrderDetailViewModel {
  const orderInfoHubPolicy = deriveOrderInfoHubPolicy({
    workOrder: args.workOrder,
    currentWorkflowState: args.currentWorkflowState,
    currentUserRole: args.currentUserRole,
  });

  return {
    headerProps: buildHeaderSectionProps(args),
    rejectionReasonNoticeProps: buildRejectionReasonNoticeProps(args),
    actionProps: buildActionSectionProps(args),
    orderInfoProps: buildOrderInfoSectionProps(args, orderInfoHubPolicy),
    productionCompositionProps: buildProductionCompositionSectionProps(args),
    costSummaryProps: buildCostSummarySectionProps(args),
    showCostSummary: true,
    showProductionComposition: args.canSeeProductionSections,
  };
}

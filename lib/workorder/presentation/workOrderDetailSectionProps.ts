import type { ComponentProps } from "react";
import { isDebugFeatureEnabled } from "@/lib/runtime/runtimeMode";
import { getAvailableOrderTypeOptions } from "@/lib/constants/workorderOptions";
import { canEditManagerInWorkflow } from "@/lib/constants/workorderStates";
import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import RejectionReasonNotice from "@/components/workorder/detail/RejectionReasonNotice";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import { formatBasicSummary } from "@/lib/workorder/detail/detailFormatting";
import type { deriveOrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { getWorkOrderBaseTitle } from "@/lib/workorder/reorder/helpers";
import type { WorkOrder } from "@/types/workorder";

type HeaderProps = ComponentProps<typeof WorkOrderHeaderSection>;
type RejectionReasonNoticeProps = ComponentProps<typeof RejectionReasonNotice>;
type ActionProps = ComponentProps<typeof WorkOrderActionSection>;
type CostSummaryProps = ComponentProps<typeof WorkOrderCostSummarySection>;
type OrderInfoProps = ComponentProps<typeof OrderInfoSection>;
type ProductionCompositionProps = ComponentProps<typeof ProductionCompositionSection>;
type OrderInfoHubPolicy = ReturnType<typeof deriveOrderInfoHubPolicy>;

export type BuildWorkOrderDetailViewModelArgs = {
  workOrder: WorkOrder;
  basicInfo: {
    category1: string;
    category2: string;
    category3: string;
    season: string;
    year: string;
  };
  currentInventoryQuantity: number;
  lastSavedAt: string | null;
  currentUserRole: HeaderProps["currentUserRole"];
  currentWorkflowState: WorkOrder["workflowState"];
  canRenameTitle: boolean;
  canEditInventory: boolean;
  canChangeManager: boolean;
  isReviewRequestLocked: boolean;
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  canSeeProductionSections: boolean;
  canSeeCostSections: boolean;
  visibleStages: ActionProps["stages"];
  currentDisplayStage: ActionProps["currentStage"];
  actions: ActionProps["actions"];
  workflowProcessingLabel?: ActionProps["workflowProcessingLabel"];
  isWorkspaceWriteLocked?: boolean;
  workspaceWriteLockMessage?: string;
  showRejectionReasonNotice?: boolean;
  rejectionReasonNoticeTitle?: string;
  rejectionReasonNoticeEmptyText?: string;
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  orderItems: OrderInfoProps["orderEntries"];
  factoryOptions: OrderInfoProps["factoryOptions"];
  editingCell: OrderInfoProps["editingCell"];
  editingValue: OrderInfoProps["editingValue"];
  canOpenInspectionModal: OrderInfoProps["canOpenInspectionModal"];
  productionSectionOpen: boolean;
  materialItems: ProductionCompositionProps["materials"];
  outsourcingItems: ProductionCompositionProps["outsourcing"];
  materialVendorOptionsById: ProductionCompositionProps["materialVendorOptionsById"];
  outsourcingVendorOptionsById: ProductionCompositionProps["outsourcingVendorOptionsById"];
  outsourcingProcessOptions: ProductionCompositionProps["outsourcingProcessOptions"];
  costSummary: {
    laborCost: number;
    lossCost: number;
    totalCost: number;
    unitCost: number;
  };
  onSave: HeaderProps["onSave"];
  onOpenBasicInfoModal: HeaderProps["onOpenBasicInfoModal"];
  onOpenManagerAssignModal: HeaderProps["onOpenManagerAssignModal"];
  onOpenInventoryEditor: HeaderProps["onOpenInventoryEditor"];
  onRenameWorkOrderTitle: HeaderProps["onRenameTitle"];
  onAction: ActionProps["onAction"];
  onToggleBasicInfo: () => void;
  onStartEdit: OrderInfoProps["onStartEdit"];
  onCommitEdit: OrderInfoProps["onCommitEdit"];
  onCancelEdit: OrderInfoProps["onCancelEdit"];
  onAddOrderEntry: OrderInfoProps["onAdd"];
  onRemoveOrderEntry: OrderInfoProps["onRemove"];
  onOpenInspectionModal: OrderInfoProps["onOpenInspectionModal"];
  onToggleProductionSection: () => void;
  onToggleMaterial: ProductionCompositionProps["onToggleMaterial"];
  onToggleOutsourcing: ProductionCompositionProps["onToggleOutsourcing"];
  onAddMaterial: ProductionCompositionProps["onAddMaterial"];
  onRemoveMaterial: ProductionCompositionProps["onRemoveMaterial"];
  onAddOutsourcing: ProductionCompositionProps["onAddOutsourcing"];
  onRemoveOutsourcing: ProductionCompositionProps["onRemoveOutsourcing"];
};

export type WorkOrderDetailViewModel = {
  headerProps: HeaderProps;
  rejectionReasonNoticeProps: RejectionReasonNoticeProps | null;
  actionProps: ActionProps;
  orderInfoProps: OrderInfoProps;
  productionCompositionProps: ProductionCompositionProps;
  costSummaryProps: CostSummaryProps;
  showCostSummary: boolean;
  showProductionComposition: boolean;
};

export function buildHeaderSectionProps({
  workOrder,
  basicInfo,
  currentInventoryQuantity,
  lastSavedAt,
  currentUserRole,
  currentWorkflowState,
  canRenameTitle,
  canEditInventory,
  canChangeManager,
  isReviewRequestLocked,
  isWorkspaceWriteLocked,
  onSave,
  onOpenBasicInfoModal,
  onOpenManagerAssignModal,
  onOpenInventoryEditor,
  onRenameWorkOrderTitle,
}: BuildWorkOrderDetailViewModelArgs): HeaderProps {
  return {
    title: getWorkOrderDisplayTitle(workOrder),
    editableTitle: getWorkOrderBaseTitle(workOrder),
    summaryText: formatBasicSummary(basicInfo),
    managerName: workOrder.manager || "-",
    currentInventoryQuantity,
    lastSavedAt,
    canChangeManager,
    currentUserRole,
    canRenameTitle,
    canEditInventory,
    onSave,
    onOpenBasicInfoModal,
    onOpenManagerAssignModal,
    onOpenInventoryEditor,
    onRenameTitle: onRenameWorkOrderTitle,
    locked: isReviewRequestLocked || Boolean(isWorkspaceWriteLocked),
    managerLocked: Boolean(isWorkspaceWriteLocked) || !canEditManagerInWorkflow(currentWorkflowState, isReviewRequestLocked),
  };
}

export function buildRejectionReasonNoticeProps({
  workOrder,
  showRejectionReasonNotice,
  rejectionReasonNoticeTitle = "반려 사유",
  rejectionReasonNoticeEmptyText = "별도 사유 없이 반려되었습니다.",
}: BuildWorkOrderDetailViewModelArgs): RejectionReasonNoticeProps | null {
  if (!showRejectionReasonNotice) return null;

  return {
    title: rejectionReasonNoticeTitle,
    emptyReasonText: rejectionReasonNoticeEmptyText,
    reason: workOrder.rejectionReason,
  };
}

export function buildActionSectionProps({
  visibleStages,
  currentDisplayStage,
  actions,
  workflowProcessingLabel,
  isWorkspaceWriteLocked,
  workspaceWriteLockMessage,
  onAction,
}: BuildWorkOrderDetailViewModelArgs): ActionProps {
  return {
    stages: visibleStages,
    currentStage: currentDisplayStage,
    actions,
    workflowProcessingLabel,
    isWorkspaceWriteLocked,
    workspaceWriteLockMessage,
    onAction,
  };
}

export function buildOrderInfoSectionProps(
  args: BuildWorkOrderDetailViewModelArgs,
  orderInfoHubPolicy: OrderInfoHubPolicy,
): OrderInfoProps {
  return {
    orderEntries: args.orderItems,
    factoryOptions: args.factoryOptions,
    orderTypeOptions: getAvailableOrderTypeOptions({ id: args.workOrder.id, reorderGroupId: args.workOrder.reorderGroupId }).filter((option) => orderInfoHubPolicy.allowedOrderTypes.includes(option)),
    open: args.basicInfoOpen,
    onToggle: args.onToggleBasicInfo,
    editingCell: args.editingCell,
    editingValue: args.editingValue,
    onStartEdit: args.onStartEdit,
    onCommitEdit: args.onCommitEdit,
    onCancelEdit: args.onCancelEdit,
    onAdd: args.onAddOrderEntry,
    onRemove: args.onRemoveOrderEntry,
    canOpenInspectionModal: args.canOpenInspectionModal,
    onOpenInspectionModal: args.onOpenInspectionModal,
    locked: args.isReviewRequestLocked || Boolean(args.isWorkspaceWriteLocked),
    orderHubPolicy: orderInfoHubPolicy,
    showDebugPanel: isDebugFeatureEnabled("orderInfoHubPanel"),
  };
}

export function buildProductionCompositionSectionProps({
  materialItems,
  outsourcingItems,
  productionSectionOpen,
  onToggleProductionSection,
  materialOpen,
  outsourcingOpen,
  onToggleMaterial,
  onToggleOutsourcing,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAddMaterial,
  onRemoveMaterial,
  onAddOutsourcing,
  onRemoveOutsourcing,
  materialVendorOptionsById,
  outsourcingVendorOptionsById,
  outsourcingProcessOptions,
  isReviewRequestLocked,
  isWorkspaceWriteLocked,
}: BuildWorkOrderDetailViewModelArgs): ProductionCompositionProps {
  return {
    materials: materialItems,
    outsourcing: outsourcingItems,
    open: productionSectionOpen,
    onToggle: onToggleProductionSection,
    materialOpen,
    outsourcingOpen,
    onToggleMaterial,
    onToggleOutsourcing,
    editingCell,
    editingValue,
    onStartEdit,
    onCommitEdit,
    onCancelEdit,
    onAddMaterial,
    onRemoveMaterial,
    onAddOutsourcing,
    onRemoveOutsourcing,
    materialVendorOptionsById,
    outsourcingVendorOptionsById,
    outsourcingProcessOptions,
    locked: isReviewRequestLocked || Boolean(isWorkspaceWriteLocked),
  };
}

export function buildCostSummarySectionProps({
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  costSummary,
  outsourcingItems,
}: BuildWorkOrderDetailViewModelArgs): CostSummaryProps {
  return {
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    laborCost: costSummary.laborCost,
    lossCost: costSummary.lossCost,
    totalCost: costSummary.totalCost,
    unitCost: costSummary.unitCost,
    outsourcing: outsourcingItems,
  };
}

import type { ComponentProps } from "react";
import WorkOrderActionSection from "@/components/workorder/detail/WorkOrderActionSection";
import WorkOrderCostSummarySection from "@/components/workorder/detail/WorkOrderCostSummarySection";
import WorkOrderHeaderSection from "@/components/workorder/detail/WorkOrderHeaderSection";
import OrderInfoSection from "@/components/workorder/detail/sections/OrderInfoSection";
import ProductionCompositionSection from "@/components/workorder/detail/sections/ProductionCompositionSection";
import { formatBasicSummary } from "@/lib/workorder/detail/detailFormatting";
import { getWorkOrderDisplayTitle } from "@/lib/workorder/presentation/workOrderPresentation";
import { getWorkOrderBaseTitle } from "@/lib/workorder/reorder/helpers";
import type { WorkOrder } from "@/types/workorder";

type HeaderProps = ComponentProps<typeof WorkOrderHeaderSection>;
type ActionProps = ComponentProps<typeof WorkOrderActionSection>;
type CostSummaryProps = ComponentProps<typeof WorkOrderCostSummarySection>;
type OrderInfoProps = ComponentProps<typeof OrderInfoSection>;
type ProductionCompositionProps = ComponentProps<typeof ProductionCompositionSection>;

type BuildWorkOrderDetailViewModelArgs = {
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

type WorkOrderDetailViewModel = {
  headerProps: HeaderProps;
  actionProps: ActionProps;
  orderInfoProps: OrderInfoProps;
  productionCompositionProps: ProductionCompositionProps;
  costSummaryProps: CostSummaryProps;
  showCostSummary: boolean;
  showProductionComposition: boolean;
};

export function buildWorkOrderDetailViewModel({
  workOrder,
  basicInfo,
  currentInventoryQuantity,
  lastSavedAt,
  currentUserRole,
  canRenameTitle,
  canEditInventory,
  canChangeManager,
  isReviewRequestLocked,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  canSeeProductionSections,
  canSeeCostSections,
  visibleStages,
  currentDisplayStage,
  actions,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  orderItems,
  factoryOptions,
  editingCell,
  editingValue,
  canOpenInspectionModal,
  productionSectionOpen,
  materialItems,
  outsourcingItems,
  materialVendorOptionsById,
  outsourcingVendorOptionsById,
  costSummary,
  onSave,
  onOpenBasicInfoModal,
  onOpenManagerAssignModal,
  onOpenInventoryEditor,
  onRenameWorkOrderTitle,
  onAction,
  onToggleBasicInfo,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAddOrderEntry,
  onRemoveOrderEntry,
  onOpenInspectionModal,
  onToggleProductionSection,
  onToggleMaterial,
  onToggleOutsourcing,
  onAddMaterial,
  onRemoveMaterial,
  onAddOutsourcing,
  onRemoveOutsourcing,
}: BuildWorkOrderDetailViewModelArgs): WorkOrderDetailViewModel {
  return {
    headerProps: {
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
      locked: isReviewRequestLocked,
    },
    actionProps: {
      stages: visibleStages,
      currentStage: currentDisplayStage,
      actions,
      onAction,
    },
    orderInfoProps: {
      orderEntries: orderItems,
      factoryOptions,
      open: basicInfoOpen,
      onToggle: onToggleBasicInfo,
      editingCell,
      editingValue,
      onStartEdit,
      onCommitEdit,
      onCancelEdit,
      onAdd: onAddOrderEntry,
      onRemove: onRemoveOrderEntry,
      canOpenInspectionModal,
      onOpenInspectionModal,
      locked: isReviewRequestLocked,
    },
    productionCompositionProps: {
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
      locked: isReviewRequestLocked,
    },
    costSummaryProps: {
      fabricTotal,
      subsidiaryTotal,
      outsourcingTotal,
      laborCost: costSummary.laborCost,
      lossCost: costSummary.lossCost,
      totalCost: costSummary.totalCost,
      unitCost: costSummary.unitCost,
      outsourcing: outsourcingItems,
    },
    showCostSummary: canSeeCostSections,
    showProductionComposition: canSeeProductionSections,
  };
}

"use client";

import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import WorkOrderDetailDesktopView from "@/components/workorder/detail/views/WorkOrderDetailDesktopView";
import WorkOrderDetailMobileView from "@/components/workorder/detail/views/WorkOrderDetailMobileView";
import WorkOrderDetailTabletView from "@/components/workorder/detail/views/WorkOrderDetailTabletView";
import type { WorkOrderDetailProps } from "@/components/workorder/detail/WorkOrderDetail.types";
import { useWorkOrderDeviceType } from "@/components/workorder/layout/useWorkOrderDeviceType";
import { useWorkOrderDetailEditor } from "@/lib/hooks/workorder/useWorkOrderDetailEditor";
import { buildWorkOrderDetailViewModel } from "@/lib/workorder/presentation/workOrderDetailPresentation";

export default function WorkOrderDetailContainer({
  workOrder,
  currentWorkflowState,
  saveStatus,
  lastSavedAt,
  currentInventoryQuantity,
  currentUserName,
  currentUserRole,
  canRenameTitle = false,
  canEditInventory,
  canChangeManager,
  canSeeProductionSections,
  canSeeCostSections,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  totalCost,
  unitCost,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  onSave,
  onOpenInventoryEditor,
  isReviewRequestLocked,
  onOpenManagerAssignModal,
  onToggleBasicInfo,
  onToggleMaterial,
  onToggleOutsourcing,
  onSetMaterialOpen,
  onSetOutsourcingOpen,
  visibleStages,
  currentDisplayStage,
  actions,
  onAction,
  onUpdateWorkOrder,
  onRenameWorkOrderTitle,
  onCompleteInspection,
  isEmpty = false,
}: WorkOrderDetailProps) {
  const deviceType = useWorkOrderDeviceType();

  const editor = useWorkOrderDetailEditor({
    workOrder,
    currentWorkflowState,
    currentUserRole,
    canEditInventory,
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    materialOpen,
    outsourcingOpen,
    onUpdateWorkOrder,
    onCompleteInspection,
  });

  if (isEmpty) {
    return <WorkOrderEmptyState />;
  }

  const viewModel = buildWorkOrderDetailViewModel({
    workOrder,
    basicInfo: editor.basicInfo,
    currentInventoryQuantity,
    lastSavedAt,
    currentUserRole,
    currentWorkflowState,
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
    orderItems: editor.orderItems,
    factoryOptions: editor.factoryOptions,
    editingCell: editor.editingCell,
    editingValue: editor.editingValue,
    canOpenInspectionModal: editor.canOpenInspectionModal,
    productionSectionOpen: editor.productionSectionOpen,
    materialItems: editor.materialItems,
    outsourcingItems: editor.outsourcingItems,
    materialVendorOptionsById: editor.materialVendorOptionsById,
    outsourcingVendorOptionsById: editor.outsourcingVendorOptionsById,
    costSummary: editor.costSummary,
    onSave,
    onOpenBasicInfoModal: editor.handleOpenBasicInfoModal,
    onOpenManagerAssignModal,
    onOpenInventoryEditor,
    onRenameWorkOrderTitle,
    onAction,
    onToggleBasicInfo,
    onStartEdit: editor.startEdit,
    onCommitEdit: editor.commitEdit,
    onCancelEdit: editor.cancelEdit,
    onAddOrderEntry: editor.addOrderEntry,
    onRemoveOrderEntry: editor.removeOrderEntry,
    onOpenInspectionModal: editor.handleOpenInspectionModal,
    onToggleProductionSection: () => {
      const nextOpen = !editor.productionSectionOpen;
      onSetMaterialOpen(nextOpen);
      onSetOutsourcingOpen(nextOpen);
    },
    onToggleMaterial,
    onToggleOutsourcing,
    onAddMaterial: editor.addMaterial,
    onRemoveMaterial: editor.removeMaterial,
    onAddOutsourcing: editor.addOutsourcing,
    onRemoveOutsourcing: editor.removeOutsourcing,
  });

  const detailViewProps = {
    viewModel,
    editor,
    currentInventoryQuantity,
  };

  if (deviceType === "mobile") {
    return <WorkOrderDetailMobileView {...detailViewProps} />;
  }

  if (deviceType === "tablet") {
    return <WorkOrderDetailTabletView {...detailViewProps} />;
  }

  return <WorkOrderDetailDesktopView {...detailViewProps} />;
}

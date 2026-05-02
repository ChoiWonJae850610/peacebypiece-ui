"use client";

import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import type {
  WorkOrderDetailActionModel,
  WorkOrderDetailCostModel,
  WorkOrderDetailDisclosureModel,
  WorkOrderDetailIdentityModel,
  WorkOrderDetailPermissionModel,
  WorkOrderDetailPersistenceModel,
  WorkOrderDetailProps,
  WorkOrderDetailWorkflowModel,
} from "@/components/workorder/detail/WorkOrderDetail.types";
import WorkOrderDetailViewSwitch from "@/components/workorder/detail/views/WorkOrderDetailViewSwitch";
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

  const persistenceModel: WorkOrderDetailPersistenceModel = {
    saveStatus,
    lastSavedAt,
  };

  const identityModel: WorkOrderDetailIdentityModel = {
    currentUserName,
    currentUserRole,
  };

  const permissionModel: WorkOrderDetailPermissionModel = {
    canRenameTitle: canRenameTitle ?? false,
    canEditInventory,
    canChangeManager,
    canSeeProductionSections,
    canSeeCostSections,
    isReviewRequestLocked,
  };

  const costModel: WorkOrderDetailCostModel = {
    fabricTotal,
    subsidiaryTotal,
    outsourcingTotal,
    totalCost,
    unitCost,
  };

  const disclosureModel: WorkOrderDetailDisclosureModel = {
    basicInfoOpen,
    materialOpen,
    outsourcingOpen,
    onToggleBasicInfo,
    onToggleMaterial,
    onToggleOutsourcing,
    onSetMaterialOpen,
    onSetOutsourcingOpen,
  };

  const workflowModel: WorkOrderDetailWorkflowModel = {
    currentWorkflowState,
    visibleStages,
    currentDisplayStage,
    actions,
  };

  const actionModel: WorkOrderDetailActionModel = {
    onSave,
    onOpenInventoryEditor,
    onOpenManagerAssignModal,
    onAction,
    onUpdateWorkOrder,
    onRenameWorkOrderTitle,
    onCompleteInspection,
  };

  const editor = useWorkOrderDetailEditor({
    workOrder,
    currentWorkflowState: workflowModel.currentWorkflowState,
    currentUserRole: identityModel.currentUserRole,
    canEditInventory: permissionModel.canEditInventory,
    fabricTotal: costModel.fabricTotal,
    subsidiaryTotal: costModel.subsidiaryTotal,
    outsourcingTotal: costModel.outsourcingTotal,
    materialOpen: disclosureModel.materialOpen,
    outsourcingOpen: disclosureModel.outsourcingOpen,
    onUpdateWorkOrder: actionModel.onUpdateWorkOrder,
    onCompleteInspection: actionModel.onCompleteInspection,
  });

  if (isEmpty) {
    return <WorkOrderEmptyState />;
  }

  const viewModel = buildWorkOrderDetailViewModel({
    workOrder,
    basicInfo: editor.basicInfo,
    currentInventoryQuantity,
    lastSavedAt: persistenceModel.lastSavedAt,
    currentUserRole: identityModel.currentUserRole,
    currentWorkflowState: workflowModel.currentWorkflowState,
    canRenameTitle: permissionModel.canRenameTitle ?? false,
    canEditInventory: permissionModel.canEditInventory,
    canChangeManager: permissionModel.canChangeManager,
    isReviewRequestLocked: permissionModel.isReviewRequestLocked,
    basicInfoOpen: disclosureModel.basicInfoOpen,
    materialOpen: disclosureModel.materialOpen,
    outsourcingOpen: disclosureModel.outsourcingOpen,
    canSeeProductionSections: permissionModel.canSeeProductionSections,
    canSeeCostSections: permissionModel.canSeeCostSections,
    visibleStages: workflowModel.visibleStages,
    currentDisplayStage: workflowModel.currentDisplayStage,
    actions: workflowModel.actions,
    fabricTotal: costModel.fabricTotal,
    subsidiaryTotal: costModel.subsidiaryTotal,
    outsourcingTotal: costModel.outsourcingTotal,
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
    outsourcingProcessOptions: editor.outsourcingProcessOptions,
    costSummary: editor.costSummary,
    onSave: actionModel.onSave,
    onOpenBasicInfoModal: editor.handleOpenBasicInfoModal,
    onOpenManagerAssignModal: actionModel.onOpenManagerAssignModal,
    onOpenInventoryEditor: actionModel.onOpenInventoryEditor,
    onRenameWorkOrderTitle: actionModel.onRenameWorkOrderTitle,
    onAction: actionModel.onAction,
    onToggleBasicInfo: disclosureModel.onToggleBasicInfo,
    onStartEdit: editor.startEdit,
    onCommitEdit: editor.commitEdit,
    onCancelEdit: editor.cancelEdit,
    onAddOrderEntry: editor.addOrderEntry,
    onRemoveOrderEntry: editor.removeOrderEntry,
    onOpenInspectionModal: editor.handleOpenInspectionModal,
    onToggleProductionSection: () => {
      const nextOpen = !editor.productionSectionOpen;
      disclosureModel.onSetMaterialOpen(nextOpen);
      disclosureModel.onSetOutsourcingOpen(nextOpen);
    },
    onToggleMaterial: disclosureModel.onToggleMaterial,
    onToggleOutsourcing: disclosureModel.onToggleOutsourcing,
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

  return <WorkOrderDetailViewSwitch {...detailViewProps} deviceType={deviceType} />;
}

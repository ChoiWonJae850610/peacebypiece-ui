"use client";

import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import type { WorkOrderDetailProps } from "@/components/workorder/detail/WorkOrderDetail.types";
import WorkOrderDetailViewSwitch from "@/components/workorder/detail/views/WorkOrderDetailViewSwitch";
import { buildWorkOrderDetailContainerModels } from "@/components/workorder/detail/workOrderDetailContainerModels";
import { useWorkOrderDeviceType } from "@/components/workorder/layout/useWorkOrderDeviceType";
import { useWorkOrderDetailEditor } from "@/lib/hooks/workorder/useWorkOrderDetailEditor";
import { buildWorkOrderDetailViewModel } from "@/lib/workorder/presentation/workOrderDetailPresentation";

export default function WorkOrderDetailContainer(props: WorkOrderDetailProps) {
  const {
    workOrder,
    currentInventoryQuantity,
    isEmpty = false,
  } = props;
  const deviceType = useWorkOrderDeviceType();

  const {
    persistenceModel,
    identityModel,
    permissionModel,
    costModel,
    disclosureModel,
    workflowModel,
    actionModel,
  } = buildWorkOrderDetailContainerModels(props);

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

  const toggleProductionSection = () => {
    const nextOpen = !editor.productionSectionOpen;
    disclosureModel.onSetMaterialOpen(nextOpen);
    disclosureModel.onSetOutsourcingOpen(nextOpen);
  };

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
    onToggleProductionSection: toggleProductionSection,
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

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

export type WorkOrderDetailContainerModels = {
  persistenceModel: WorkOrderDetailPersistenceModel;
  identityModel: WorkOrderDetailIdentityModel;
  permissionModel: WorkOrderDetailPermissionModel;
  costModel: WorkOrderDetailCostModel;
  disclosureModel: WorkOrderDetailDisclosureModel;
  workflowModel: WorkOrderDetailWorkflowModel;
  actionModel: WorkOrderDetailActionModel;
};

export function buildWorkOrderDetailContainerModels({
  saveStatus,
  lastSavedAt,
  currentUserName,
  currentUserRole,
  canRenameTitle = false,
  canEditInventory,
  canChangeManager,
  canSeeProductionSections,
  canSeeCostSections,
  isReviewRequestLocked,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  totalCost,
  unitCost,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  onToggleBasicInfo,
  onToggleMaterial,
  onToggleOutsourcing,
  onSetMaterialOpen,
  onSetOutsourcingOpen,
  currentWorkflowState,
  visibleStages,
  currentDisplayStage,
  actions,
  onSave,
  onOpenInventoryEditor,
  onOpenManagerAssignModal,
  onAction,
  onUpdateWorkOrder,
  onRenameWorkOrderTitle,
  onCompleteInspection,
}: WorkOrderDetailProps): WorkOrderDetailContainerModels {
  return {
    persistenceModel: {
      saveStatus,
      lastSavedAt,
    },
    identityModel: {
      currentUserName,
      currentUserRole,
    },
    permissionModel: {
      canRenameTitle,
      canEditInventory,
      canChangeManager,
      canSeeProductionSections,
      canSeeCostSections,
      isReviewRequestLocked,
    },
    costModel: {
      fabricTotal,
      subsidiaryTotal,
      outsourcingTotal,
      totalCost,
      unitCost,
    },
    disclosureModel: {
      basicInfoOpen,
      materialOpen,
      outsourcingOpen,
      onToggleBasicInfo,
      onToggleMaterial,
      onToggleOutsourcing,
      onSetMaterialOpen,
      onSetOutsourcingOpen,
    },
    workflowModel: {
      currentWorkflowState,
      visibleStages,
      currentDisplayStage,
      actions,
    },
    actionModel: {
      onSave,
      onOpenInventoryEditor,
      onOpenManagerAssignModal,
      onAction,
      onUpdateWorkOrder,
      onRenameWorkOrderTitle,
      onCompleteInspection,
    },
  };
}

"use client";

import WorkOrderEmptyState from "@/components/workorder/WorkOrderEmptyState";
import type { WorkOrderDetailProps } from "@/components/workorder/detail/WorkOrderDetail.types";
import WorkOrderDetailViewSwitch from "@/components/workorder/detail/views/WorkOrderDetailViewSwitch";
import { buildWorkOrderDetailContainerModels } from "@/components/workorder/detail/workOrderDetailContainerModels";
import { useWorkOrderDeviceType } from "@/components/workorder/layout/useWorkOrderDeviceType";
import { useWorkOrderDetailEditor } from "@/lib/hooks/workorder/useWorkOrderDetailEditor";
import { WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import { useI18n } from "@/lib/i18n";
import { buildWorkOrderDetailViewModel } from "@/lib/workorder/presentation/workOrderDetailPresentation";

export default function WorkOrderDetailContainer(props: WorkOrderDetailProps) {
  const {
    workOrder,
    currentInventoryQuantity,
    isEmpty = false,
  } = props;
  const deviceType = useWorkOrderDeviceType();
  const { i18n } = useI18n();
  const isWorkspaceWriteLocked = Boolean(props.isWorkspaceWriteLocked || props.workflowProcessingLabel);
  const currentUserOwnerIds = [props.currentUserId, props.currentUserCompanyMemberId].map((value) => value?.trim()).filter(Boolean);
  const isRejectedManager = workOrder.workflowState === WORKFLOW_STATE.rejected && Boolean(workOrder.managerId) && currentUserOwnerIds.includes(workOrder.managerId ?? "");

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
    canCompleteInspection: permissionModel.canCompleteInspection,
    fabricTotal: costModel.fabricTotal,
    subsidiaryTotal: costModel.subsidiaryTotal,
    outsourcingTotal: costModel.outsourcingTotal,
    materialOpen: disclosureModel.materialOpen,
    outsourcingOpen: disclosureModel.outsourcingOpen,
    onUpdateWorkOrder: isWorkspaceWriteLocked ? () => undefined : actionModel.onUpdateWorkOrder,
    onCompleteInspection: isWorkspaceWriteLocked ? () => undefined : actionModel.onCompleteInspection,
  });

  if (isEmpty) {
    return <WorkOrderEmptyState />;
  }

  const toggleProductionSection = () => {
    const nextOpen = !editor.productionSectionOpen;
    disclosureModel.onSetMaterialOpen(nextOpen);
    disclosureModel.onSetOutsourcingOpen(nextOpen);
  };

  const runAfterPendingDetailFlush = (callback: () => void) => {
    const didFlush = editor.flushPendingDetailEdit();
    if (didFlush && typeof window !== "undefined") {
      window.setTimeout(callback, 0);
      return;
    }

    callback();
  };

  const runActionWithCurrentDetailDraft = (action: Parameters<typeof actionModel.onAction>[0]) => {
    const run = () => actionModel.onAction(action, editor.getDraftWorkOrderSnapshot());

    runAfterPendingDetailFlush(run);
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
    workflowProcessingLabel: workflowModel.workflowProcessingLabel,
    isWorkspaceWriteLocked,
    workspaceWriteLockMessage: props.workspaceWriteLockMessage,
    showRejectionReasonNotice: isRejectedManager,
    rejectionReasonNoticeTitle: i18n.workorder.ui.rejectionReasonNotice.title,
    rejectionReasonNoticeEmptyText: i18n.workorder.ui.rejectionReasonNotice.emptyReason,
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
    onSave: isWorkspaceWriteLocked ? () => undefined : () => runAfterPendingDetailFlush(() => actionModel.onSave(editor.getDraftWorkOrderSnapshot())),
    onOpenBasicInfoModal: isWorkspaceWriteLocked ? () => undefined : editor.handleOpenBasicInfoModal,
    onOpenManagerAssignModal: isWorkspaceWriteLocked ? () => undefined : actionModel.onOpenManagerAssignModal,
    onOpenInventoryEditor: isWorkspaceWriteLocked ? () => undefined : actionModel.onOpenInventoryEditor,
    onRenameWorkOrderTitle: isWorkspaceWriteLocked ? () => undefined : actionModel.onRenameWorkOrderTitle,
    onAction: isWorkspaceWriteLocked ? () => undefined : runActionWithCurrentDetailDraft,
    onToggleBasicInfo: disclosureModel.onToggleBasicInfo,
    onStartEdit: isWorkspaceWriteLocked ? () => undefined : editor.startEdit,
    onCommitEdit: isWorkspaceWriteLocked ? () => undefined : editor.commitEdit,
    onCancelEdit: editor.cancelEdit,
    onAddOrderEntry: isWorkspaceWriteLocked ? () => undefined : editor.addOrderEntry,
    onRemoveOrderEntry: isWorkspaceWriteLocked ? () => undefined : editor.removeOrderEntry,
    onSaveOrderEntryDraft: isWorkspaceWriteLocked ? () => undefined : (orderEntryId, draft) => editor.saveOrderEntryDraft(orderEntryId, draft as Parameters<typeof editor.saveOrderEntryDraft>[1]),
    onSaveOutsourcingDraft: isWorkspaceWriteLocked ? () => undefined : (outsourcingId, draft) => editor.saveOutsourcingDraft(outsourcingId, draft as Parameters<typeof editor.saveOutsourcingDraft>[1]),
    onOpenInspectionModal: isWorkspaceWriteLocked ? () => undefined : editor.handleOpenInspectionModal,
    onToggleProductionSection: toggleProductionSection,
    onToggleMaterial: disclosureModel.onToggleMaterial,
    onToggleOutsourcing: disclosureModel.onToggleOutsourcing,
    onAddMaterial: isWorkspaceWriteLocked ? () => undefined : editor.addMaterial,
    onRemoveMaterial: isWorkspaceWriteLocked ? () => undefined : editor.removeMaterial,
    onRemoveZeroQuantityMaterials: isWorkspaceWriteLocked ? () => undefined : editor.removeZeroQuantityMaterials,
    onSaveMaterialDraft: isWorkspaceWriteLocked ? () => undefined : editor.saveMaterialDraft,
    onAddOutsourcing: isWorkspaceWriteLocked ? () => undefined : editor.addOutsourcing,
    onRemoveOutsourcing: isWorkspaceWriteLocked ? () => undefined : editor.removeOutsourcing,
  });

  const detailViewProps = {
    viewModel,
    editor,
    currentInventoryQuantity,
  };

  return <WorkOrderDetailViewSwitch {...detailViewProps} deviceType={deviceType} />;
}

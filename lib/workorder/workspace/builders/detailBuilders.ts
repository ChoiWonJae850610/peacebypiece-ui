import { formatRecentKstDateTime } from "@/lib/workorder/presentation/dateTimePresentation";
import { buildAttachmentPanelSections } from "@/lib/workorder/presentation/workOrderWorkspacePresentation";
import { isWorkflowStateAtLeast, WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import { isGeneratedOrderRequestPdfAttachment } from "@/lib/workorder/generatedDocuments";
import { canCompleteInspectionByPolicy, canRequestFactoryOrderByPolicy } from "@/lib/workorder/workflowPolicy";
import type { DetailProps, DetailViewModelArgs, SidePanelProps, SidePanelViewModelArgs } from "@/lib/workorder/workspace/viewModelTypes";
import type { UserProfile, WorkOrder } from "@/types/workorder";

function findUserDisplayName(users: UserProfile[] | undefined, userId: string | null | undefined) {
  const normalizedUserId = (userId ?? "").trim();
  if (!normalizedUserId) return null;

  const matched = (users ?? []).find((user) => {
    const id = user.id.trim();
    const companyMemberId = user.companyMemberId?.trim() ?? "";
    return id === normalizedUserId || companyMemberId === normalizedUserId;
  });

  const name = matched?.name?.trim();
  return name || null;
}

function applyLatestManagerDisplayName(workOrder: WorkOrder, users: UserProfile[] | undefined): WorkOrder {
  const nextManagerName = findUserDisplayName(users, workOrder.managerId);
  if (!nextManagerName || nextManagerName === workOrder.manager) return workOrder;
  return { ...workOrder, manager: nextManagerName };
}

export function buildDetailProps({
  selectedWorkOrder,
  hasVisibleWorkOrders,
  currentWorkflowState,
  saveStatus,
  lastSavedAt,
  currentUser,
  users,
  currentRole,
  canChangeManager,
  canSeeProductionSections,
  canSeeCostSections,
  canOpenInventoryEditor,
  currentDisplayStage,
  currentInventoryQuantity,
  fabricTotal,
  subsidiaryTotal,
  outsourcingTotal,
  totalCost,
  unitCost,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
  canRenameTitle,
  isReviewRequestLocked,
  visibleStages,
  availableActions,
  workflowProcessingLabel,
  isWorkspaceWriteLocked,
  workspaceWriteLockMessage,
  onSave,
  onWorkflowAction,
  onUpdateSelectedWorkOrder,
  onRenameWorkOrderTitle,
  onCompleteInspection,
  onOpenManagerAssignModal,
  onSetBasicInfoOpen,
  onSetMaterialOpen,
  onSetOutsourcingOpen,
  onSetInventoryEditorOpen,
}: DetailViewModelArgs): DetailProps {
  return {
    workOrder: applyLatestManagerDisplayName(selectedWorkOrder, users),
    isEmpty: !hasVisibleWorkOrders,
    currentWorkflowState,
    saveStatus,
    lastSavedAt: formatRecentKstDateTime(lastSavedAt),
    currentInventoryQuantity,
    currentUserName: currentUser.name,
    currentUserId: currentUser.id,
    currentUserCompanyMemberId: currentUser.companyMemberId ?? null,
    currentUserRole: currentRole,
    canRenameTitle,
    canEditInventory: canOpenInventoryEditor,
    canCompleteInspection: canCompleteInspectionByPolicy({
      currentRoles: currentUser.roles,
      currentUser,
      currentUserId: currentUser.id,
      workOrder: selectedWorkOrder,
    }),
    canChangeManager,
    onOpenManagerAssignModal,
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
    onOpenInventoryEditor: () => onSetInventoryEditorOpen(true),
    isReviewRequestLocked,
    onToggleBasicInfo: () => onSetBasicInfoOpen((prev) => !prev),
    onToggleMaterial: () => onSetMaterialOpen((prev) => !prev),
    onToggleOutsourcing: () => onSetOutsourcingOpen((prev) => !prev),
    onSetMaterialOpen,
    onSetOutsourcingOpen,
    visibleStages,
    currentDisplayStage,
    actions: availableActions,
    workflowProcessingLabel,
    isWorkspaceWriteLocked,
    workspaceWriteLockMessage,
    onAction: onWorkflowAction,
    onUpdateWorkOrder: onUpdateSelectedWorkOrder,
    onRenameWorkOrderTitle,
    onCompleteInspection,
  };
}

export function buildSidePanelProps({
  hasVisibleWorkOrders,
  canSeeAttachments,
  canUploadOfficialAttachments,
  designAttachments,
  officialAttachments,
  selectedWorkOrder,
  currentWorkflowState,
  currentUser,
  i18n,
  isWorkspaceWriteLocked,
  workspaceWriteLockMessage,
  canEditSideDraftContent,
  getAttachmentPermissions,
  onOpenAttachmentPicker,
  onUploadAttachmentFiles,
  onRequestDeleteAttachment,
  onSetPrimaryDesignAttachment,
  onGenerateOrderRequestPdf,
}: SidePanelViewModelArgs): SidePanelProps {
  const hasGeneratedOrderRequestPdf = officialAttachments.some((attachment) => isGeneratedOrderRequestPdfAttachment(attachment));
  const canGenerateOrderRequestPdf =
    hasVisibleWorkOrders &&
    canSeeAttachments &&
    !hasGeneratedOrderRequestPdf &&
    isWorkflowStateAtLeast(currentWorkflowState, WORKFLOW_STATE.inspection) &&
    canRequestFactoryOrderByPolicy({
      currentRoles: currentUser.roles,
      currentUser,
      currentUserId: currentUser.id,
      currentWorkflowState,
      workOrder: selectedWorkOrder,
    });

  return {
    isEmpty: !hasVisibleWorkOrders,
    canSeeAttachments,
    canManageAttachments: canUploadOfficialAttachments,
    writeLocked: Boolean(isWorkspaceWriteLocked),
    writeLockMessage: workspaceWriteLockMessage,
    sizeSpecWorkOrderId: selectedWorkOrder.id,
    sizeSpecLocked: Boolean(isWorkspaceWriteLocked),
    factoryInstructionWorkOrderId: selectedWorkOrder.id,
    canEditFactoryInstruction: canEditSideDraftContent && !isWorkspaceWriteLocked,
    factoryInstructionLockMessage: workspaceWriteLockMessage ?? (canEditSideDraftContent ? undefined : "현재 단계 또는 권한에서는 공장 전달사항을 수정할 수 없습니다."),
    attachmentSections: buildAttachmentPanelSections({
      designTitle: i18n.workorder.ui.attachmentPanel.designTitle,
      designEmptyText: i18n.workorder.ui.attachmentPanel.designEmpty,
      designAddButtonLabel: i18n.workorder.ui.attachmentPanel.designAddButton,
      officialTitle: i18n.workorder.ui.attachmentPanel.title,
      officialEmptyText: i18n.workorder.ui.attachmentPanel.empty,
      officialAddButtonLabel: i18n.workorder.ui.attachmentPanel.addButton,
      designAttachments,
      officialAttachments,
      getAttachmentPermissions,
    }),
    onOpenAttachmentPicker,
    onUploadAttachmentFiles,
    onPreviewAttachment: () => undefined,
    onDeleteAttachment: onRequestDeleteAttachment,
    onSetPrimaryDesignAttachment,
    canGenerateOrderRequestPdf,
    onGenerateOrderRequestPdf: () => onGenerateOrderRequestPdf(selectedWorkOrder.id),
  };
}

export function applySidePanelPreviewHandler(
  sidePanelProps: SidePanelProps,
  onSetAttachmentPreviewId: (next: string | null) => void,
): SidePanelProps {
  return {
    ...sidePanelProps,
    onPreviewAttachment: onSetAttachmentPreviewId,
  };
}

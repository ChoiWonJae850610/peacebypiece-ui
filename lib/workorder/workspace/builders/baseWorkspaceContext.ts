import type {
  BaseWorkspaceViewModelArgs,
  BuildWorkspaceViewModelArgs,
} from "@/lib/workorder/workspace/viewModelTypes";

type BuildBaseWorkspaceContextOptions = {
  version: string;
  isWorkspaceWriteLocked: boolean;
  workspaceWriteLockMessage?: string;
};

export function buildBaseWorkspaceContext(
  args: BuildWorkspaceViewModelArgs,
  options: BuildBaseWorkspaceContextOptions,
): BaseWorkspaceViewModelArgs {
  return {
    version: options.version,
    currentUser: args.currentUser,
    users: args.users,
    currentRole: args.currentRole,
    selectedWorkOrder: args.selectedWorkOrder,
    hasVisibleWorkOrders: args.hasVisibleWorkOrders,
    currentWorkflowState: args.currentWorkflowState,
    canCreateWorkOrder: args.canCreateWorkOrder,
    canSeeAttachments: args.canSeeAttachments,
    canUploadOfficialAttachments: args.canUploadOfficialAttachments,
    canRenameTitle: args.canRenameTitle,
    isAdmin: args.isAdmin,
    isReviewRequestLocked: args.isReviewRequestLocked,
    canEditSideDraftContent: args.canEditSideDraftContent,
    canChangeManager: args.canChangeManager,
    canSeeProductionSections: args.canSeeProductionSections,
    canSeeCostSections: args.canSeeCostSections,
    canOpenInventoryEditor: args.canOpenInventoryEditor,
    currentDisplayStage: args.currentDisplayStage,
    currentInventoryQuantity: args.currentInventoryQuantity,
    designAttachments: args.designAttachments,
    officialAttachments: args.officialAttachments,
    selectedAttachment: args.selectedAttachment,
    fabricTotal: args.fabricTotal,
    subsidiaryTotal: args.subsidiaryTotal,
    outsourcingTotal: args.outsourcingTotal,
    totalCost: args.totalCost,
    unitCost: args.unitCost,
    saveStatus: args.saveStatus,
    lastSavedAt: args.lastSavedAt,
    availableActions: args.availableActions,
    visibleStages: args.visibleStages,
    workflowProcessingLabel: args.workflowProcessingLabel,
    isWorkspaceWriteLocked: options.isWorkspaceWriteLocked,
    workspaceWriteLockMessage: options.workspaceWriteLockMessage,
    getAttachmentPermissions: args.getAttachmentPermissions,
    i18n: args.i18n,
    onSave: args.onSave,
    onWorkflowAction: args.onWorkflowAction,
    onUpdateSelectedWorkOrder: args.onUpdateSelectedWorkOrder,
    onRenameWorkOrderTitle: args.onRenameWorkOrderTitle,
    onCompleteInspection: args.onCompleteInspection,
    onOpenManagerAssignModal: args.onOpenManagerAssignModal,
    onOpenAttachmentPicker: args.onOpenAttachmentPicker,
    onUploadAttachmentFiles: args.onUploadAttachmentFiles,
    onRequestDeleteAttachment: args.onRequestDeleteAttachment,
    onSetPrimaryDesignAttachment: args.onSetPrimaryDesignAttachment,
  };
}

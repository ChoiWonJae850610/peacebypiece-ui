import type { ComponentProps } from "react";
import SidebarContent from "@/components/layout/SidebarContent";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import { isInspectorRole } from "@/lib/constants/roles";
import type { Attachment, HistoryFilter, InventoryLog, RoleType, UserProfile, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";
import type { NotificationSettingKey } from "@/types/workflow";

type SidebarListProps = ComponentProps<typeof SidebarContent>;
type DetailProps = ComponentProps<typeof WorkOrderDetail>;
type SidePanelProps = ComponentProps<typeof WorkOrderSidePanel>;
type MobileTopBarProps = ComponentProps<typeof MobileTopBar>;
type MobileDrawerProps = ComponentProps<typeof MobileDrawer>;
type ModalProps = ComponentProps<typeof WorkOrderOverlay>["modalProps"];

type BaseWorkspaceViewModelArgs = {
  version: string;
  isAdmin: boolean;
  currentUser: UserProfile;
  currentRole: RoleType;
  selectedWorkOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  canCreateWorkOrder: boolean;
  canSeeAttachments: boolean;
  canUploadOfficialAttachments: boolean;
  isReviewRequestLocked: boolean;
  canChangeManager: boolean;
  canSeeProductionSections: boolean;
  canSeeCostSections: boolean;
  canOpenInventoryEditor: boolean;
  currentDisplayStage: DetailProps["currentDisplayStage"];
  currentInventoryQuantity: number;
  officialAttachments: Attachment[];
  selectedAttachment: Attachment | null;
  fabricTotal: number;
  subsidiaryTotal: number;
  outsourcingTotal: number;
  totalCost: number;
  unitCost: number;
  saveStatus: DetailProps["saveStatus"];
  lastSavedAt: string | null;
  availableActions: WorkflowAction[];
  visibleStages: DetailProps["visibleStages"];
  canDeleteAttachment: SidePanelProps["canDeleteAttachment"];
  onSave: () => void;
  onWorkflowAction: (action: WorkflowAction) => void;
  onUpdateSelectedWorkOrder: (patch: Partial<WorkOrder>) => void;
  onRenameWorkOrderTitle: (nextTitle: string) => void;
  onCompleteInspection: DetailProps["onCompleteInspection"];
  onOpenManagerAssignModal: () => void;
  onOpenAttachmentPicker: () => void;
  onRequestDeleteAttachment: (attachmentId: string) => void;
  onCreateMemoThread: SidePanelProps["onCreateMemoThread"];
  onCreateMemoReply: SidePanelProps["onCreateMemoReply"];
  onPromoteMemoAttachment: SidePanelProps["onPromoteMemoAttachment"];
};

type SidebarViewModelArgs = {
  version: string;
  isAdmin: boolean;
  currentUser: UserProfile;
  workOrders: SidebarListProps["workOrders"];
  selectedId: string;
  workflowStateById: Record<string, string>;
  canDeleteWorkOrder: SidebarListProps["canDelete"];
  canCreateWorkOrder: boolean;
  searchQuery: string;
  onSelectWorkOrder: (id: string) => void;
  onSetCreateWorkOrderModalOpen: (next: boolean) => void;
  onSetPermissionModalOpen: (next: boolean) => void;
  onSetAdminPanelModalOpen: (next: boolean) => void;
  onReorderWorkOrder: (id: string) => void;
  onDeleteWorkOrder: (id: string) => void;
  onSetSearchQuery: (next: string) => void;
};

type DetailViewModelArgs = BaseWorkspaceViewModelArgs & {
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
  onSetBasicInfoOpen: (updater: (prev: boolean) => boolean) => void;
  onSetMaterialOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  onSetOutsourcingOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  onSetInventoryEditorOpen: (next: boolean) => void;
};

type SidePanelViewModelArgs = BaseWorkspaceViewModelArgs;

type ModalViewModelArgs = {
  isAdmin: boolean;
  inventoryEditorOpen: boolean;
  permissionModalOpen: boolean;
  createWorkOrderModalOpen: boolean;
  adminPanelModalOpen: boolean;
  managerAssignModalOpen: boolean;
  inventoryLogModalOpen: boolean;
  orderRequestConfirmOpen: boolean;
  users: UserProfile[];
  currentUserId: string;
  permissionTargetUserId: string;
  historyFilter: HistoryFilter;
  notificationSettings: Record<NotificationSettingKey, boolean>;
  currentRole: RoleType;
  selectedWorkOrder: WorkOrder;
  currentInventoryQuantity: number;
  filteredHistoryLogs: ModalProps["inventoryLog"]["logs"];
  inventoryLogs: InventoryLog[];
  selectedAttachment: Attachment | null;
  pendingAttachmentDelete: Attachment | null;
  canDeleteAttachment: SidePanelProps["canDeleteAttachment"];
  onSetInventoryEditorOpen: (next: boolean) => void;
  onSetPermissionModalOpen: (next: boolean) => void;
  onSetCreateWorkOrderModalOpen: (next: boolean) => void;
  onSetAdminPanelModalOpen: (next: boolean) => void;
  onSetInventoryLogModalOpen: (next: boolean) => void;
  onSetAttachmentPreviewId: (next: string | null) => void;
  onSetPermissionTargetUserId: (next: string) => void;
  onSetCurrentUserId: (next: string) => void;
  onSetHistoryFilter: (next: HistoryFilter) => void;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
  onCreateWorkOrder: ModalProps["createWorkOrder"]["onCreate"];
  onConfirmOrderRequest: () => void;
  onCloseOrderRequestConfirm: () => void;
  onInventoryApply: ModalProps["inventoryEditor"]["onApply"];
  onApplyRoles: ModalProps["permission"]["onApplyRoles"];
  onCloseManagerAssignModal: () => void;
  onChangeManager: (managerId: string) => void;
  onRequestDeleteAttachment: (attachmentId: string) => void;
  onAttachmentDeleteConfirmClose: () => void;
  onAttachmentDeleteConfirm: () => void;
};

type MobileViewModelArgs = {
  version: string;
  isAdmin: boolean;
  drawerOpen: boolean;
  sidebarListProps: SidebarListProps;
  onSetDrawerOpen: (next: boolean) => void;
  onSetPermissionModalOpen: (next: boolean) => void;
  onSetAdminPanelModalOpen: (next: boolean) => void;
  onReorderWorkOrder: (id: string) => void;
};

export function buildSidebarListProps({
  version,
  isAdmin,
  currentUser,
  workOrders,
  selectedId,
  workflowStateById,
  canDeleteWorkOrder,
  canCreateWorkOrder,
  searchQuery,
  onSelectWorkOrder,
  onSetCreateWorkOrderModalOpen,
  onSetPermissionModalOpen,
  onSetAdminPanelModalOpen,
  onReorderWorkOrder,
  onDeleteWorkOrder,
  onSetSearchQuery,
}: SidebarViewModelArgs): SidebarListProps {
  return {
    version,
    workOrders,
    selectedId,
    workflowStateById,
    onSelect: onSelectWorkOrder,
    onCreate: () => onSetCreateWorkOrderModalOpen(true),
    onOpenSettings: () => onSetPermissionModalOpen(true),
    onOpenAdminPanel: isAdmin ? () => onSetAdminPanelModalOpen(true) : undefined,
    onReorder: onReorderWorkOrder,
    onDelete: onDeleteWorkOrder,
    canDelete: canDeleteWorkOrder,
    canCreate: canCreateWorkOrder,
    canManageListActions: !isInspectorRole(currentUser),
    searchQuery,
    onSearchQueryChange: onSetSearchQuery,
  };
}

export function buildDetailProps({
  selectedWorkOrder,
  currentWorkflowState,
  saveStatus,
  lastSavedAt,
  currentUser,
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
  isAdmin,
  isReviewRequestLocked,
  visibleStages,
  availableActions,
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
    workOrder: selectedWorkOrder,
    currentWorkflowState,
    saveStatus,
    lastSavedAt,
    currentInventoryQuantity,
    currentUserName: currentUser.name,
    currentUserRole: currentRole,
    canRenameTitle: isAdmin,
    canEditInventory: canOpenInventoryEditor,
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
    onAction: onWorkflowAction,
    onUpdateWorkOrder: onUpdateSelectedWorkOrder,
    onRenameWorkOrderTitle,
    onCompleteInspection,
  };
}

export function buildSidePanelProps({
  canSeeAttachments,
  canUploadOfficialAttachments,
  officialAttachments,
  currentRole,
  selectedWorkOrder,
  currentUser,
  canDeleteAttachment,
  onOpenAttachmentPicker,
  onRequestDeleteAttachment,
  onCreateMemoThread,
  onCreateMemoReply,
  onPromoteMemoAttachment,
}: SidePanelViewModelArgs): SidePanelProps {
  return {
    canSeeAttachments,
    canUploadOfficialAttachments,
    attachments: officialAttachments,
    onOpenAttachmentPicker,
    onPreviewAttachment: () => undefined,
    onDeleteAttachment: onRequestDeleteAttachment,
    canDeleteAttachment,
    currentRole,
    workOrder: selectedWorkOrder,
    currentUserName: currentUser.name,
    onCreateMemoThread,
    onCreateMemoReply,
    canPromoteMemoAttachment: canUploadOfficialAttachments,
    onPromoteMemoAttachment,
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

export function buildModalProps({
  isAdmin,
  inventoryEditorOpen,
  permissionModalOpen,
  createWorkOrderModalOpen,
  adminPanelModalOpen,
  managerAssignModalOpen,
  inventoryLogModalOpen,
  orderRequestConfirmOpen,
  users,
  currentUserId,
  permissionTargetUserId,
  historyFilter,
  notificationSettings,
  currentRole,
  selectedWorkOrder,
  currentInventoryQuantity,
  filteredHistoryLogs,
  inventoryLogs,
  selectedAttachment,
  pendingAttachmentDelete,
  canDeleteAttachment,
  onSetInventoryEditorOpen,
  onSetPermissionModalOpen,
  onSetCreateWorkOrderModalOpen,
  onSetAdminPanelModalOpen,
  onSetInventoryLogModalOpen,
  onSetAttachmentPreviewId,
  onSetPermissionTargetUserId,
  onSetCurrentUserId,
  onSetHistoryFilter,
  onToggleNotificationSetting,
  onCreateWorkOrder,
  onConfirmOrderRequest,
  onCloseOrderRequestConfirm,
  onInventoryApply,
  onApplyRoles,
  onCloseManagerAssignModal,
  onChangeManager,
  onRequestDeleteAttachment,
  onAttachmentDeleteConfirmClose,
  onAttachmentDeleteConfirm,
}: ModalViewModelArgs): ModalProps {
  return {
    orderRequestConfirm: {
      open: orderRequestConfirmOpen,
      workOrder: selectedWorkOrder,
      onClose: onCloseOrderRequestConfirm,
      onConfirm: onConfirmOrderRequest,
    },
    attachmentPreview: {
      attachment: selectedAttachment,
      canDelete: canDeleteAttachment(selectedAttachment),
      onClose: () => onSetAttachmentPreviewId(null),
      onDelete: () => selectedAttachment && onRequestDeleteAttachment(selectedAttachment.id),
    },
    attachmentDeleteConfirm: {
      open: pendingAttachmentDelete !== null,
      attachment: pendingAttachmentDelete,
      onClose: onAttachmentDeleteConfirmClose,
      onConfirm: onAttachmentDeleteConfirm,
    },
    inventoryLog: {
      open: inventoryLogModalOpen && isAdmin,
      onClose: () => onSetInventoryLogModalOpen(false),
      logs: filteredHistoryLogs,
      role: currentRole,
      filter: historyFilter,
    },
    managerAssign: {
      open: managerAssignModalOpen,
      onClose: onCloseManagerAssignModal,
      users,
      currentManagerId: selectedWorkOrder.managerId ?? null,
      currentManagerName: selectedWorkOrder.manager,
      onSelectManager: onChangeManager,
    },
    inventoryEditor: {
      open: inventoryEditorOpen,
      onClose: () => onSetInventoryEditorOpen(false),
      currentStock: currentInventoryQuantity,
      currentUserName: users.find((user) => user.id === currentUserId)?.name ?? "-",
      logs: inventoryLogs,
      showRecentLogs: isAdmin,
      onApply: onInventoryApply,
    },
    createWorkOrder: {
      open: createWorkOrderModalOpen,
      onClose: () => onSetCreateWorkOrderModalOpen(false),
      onCreate: onCreateWorkOrder,
    },
    permission: {
      open: permissionModalOpen,
      onClose: () => onSetPermissionModalOpen(false),
      users,
      currentUserId,
      selectedUserId: permissionTargetUserId,
      onSelectedUserChange: onSetPermissionTargetUserId,
      onApplyRoles,
      onCurrentUserChange: onSetCurrentUserId,
    },
    adminPanel: {
      open: adminPanelModalOpen && isAdmin,
      onClose: () => onSetAdminPanelModalOpen(false),
      notificationSettings,
      onToggleNotificationSetting,
      historyLogs: filteredHistoryLogs,
      historyFilter,
      onHistoryFilterChange: onSetHistoryFilter,
    },
  };
}

export function buildMobileTopBarProps({
  version,
  isAdmin,
  onSetDrawerOpen,
  onSetPermissionModalOpen,
  onSetAdminPanelModalOpen,
}: Pick<MobileViewModelArgs, "version" | "isAdmin" | "onSetDrawerOpen" | "onSetPermissionModalOpen" | "onSetAdminPanelModalOpen">): MobileTopBarProps {
  return {
    version,
    onOpen: () => onSetDrawerOpen(true),
    onOpenSettings: () => onSetPermissionModalOpen(true),
    onOpenAdminPanel: isAdmin ? () => onSetAdminPanelModalOpen(true) : undefined,
  };
}

export function buildMobileDrawerProps({
  drawerOpen,
  sidebarListProps,
  onSetDrawerOpen,
  onReorderWorkOrder,
}: Pick<MobileViewModelArgs, "drawerOpen" | "sidebarListProps" | "onSetDrawerOpen" | "onReorderWorkOrder">): MobileDrawerProps {
  return {
    ...sidebarListProps,
    open: drawerOpen,
    onClose: () => onSetDrawerOpen(false),
    onReorder: (id: string) => {
      onReorderWorkOrder(id);
      onSetDrawerOpen(false);
    },
  };
}

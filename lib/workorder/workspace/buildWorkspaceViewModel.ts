import type { ComponentProps } from "react";
import SidebarContent from "@/components/layout/SidebarContent";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import { APP_VERSION } from "@/lib/constants/app";
import { isInspectorRole } from "@/lib/constants/roles";
import type { Attachment, HistoryFilter, InventoryLog, RoleType, UserProfile, WorkOrder, WorkflowAction, WorkflowState } from "@/types/workorder";
import type { NotificationSettingKey } from "@/types/workflow";

type SidebarListProps = ComponentProps<typeof SidebarContent>;
type DetailProps = ComponentProps<typeof WorkOrderDetail>;
type SidePanelProps = ComponentProps<typeof WorkOrderSidePanel>;
type MobileTopBarProps = ComponentProps<typeof MobileTopBar>;
type MobileDrawerProps = ComponentProps<typeof MobileDrawer>;
type ModalProps = ComponentProps<typeof WorkOrderOverlay>["modalProps"];

type BuildWorkspaceViewModelArgs = {
  drawerOpen: boolean;
  basicInfoOpen: boolean;
  materialOpen: boolean;
  outsourcingOpen: boolean;
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
  searchQuery: string;
  workOrders: SidebarListProps["workOrders"];
  workflowStateById: Record<string, string>;
  selectedId: string;
  selectedWorkOrder: WorkOrder;
  currentWorkflowState: WorkflowState;
  currentUser: UserProfile;
  currentRole: RoleType;
  isAdmin: boolean;
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
  filteredHistoryLogs: ModalProps["inventoryLog"]["logs"];
  inventoryLogs: InventoryLog[];
  officialAttachments: Attachment[];
  selectedAttachment: Attachment | null;
  outsourcingTotal: number;
  fabricTotal: number;
  subsidiaryTotal: number;
  totalCost: number;
  unitCost: number;
  saveStatus: DetailProps["saveStatus"];
  lastSavedAt: string | null;
  availableActions: WorkflowAction[];
  visibleStages: DetailProps["visibleStages"];
  pendingAttachmentDelete: Attachment | null;
  canDeleteWorkOrder: SidebarListProps["canDelete"];
  canDeleteAttachment: SidePanelProps["canDeleteAttachment"];
  onSetDrawerOpen: (next: boolean) => void;
  onSetBasicInfoOpen: (updater: (prev: boolean) => boolean) => void;
  onSetMaterialOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  onSetOutsourcingOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
  onSetInventoryEditorOpen: (next: boolean) => void;
  onSetPermissionModalOpen: (next: boolean) => void;
  onSetCreateWorkOrderModalOpen: (next: boolean) => void;
  onSetAdminPanelModalOpen: (next: boolean) => void;
  onSetInventoryLogModalOpen: (next: boolean) => void;
  onSetAttachmentPreviewId: (next: string | null) => void;
  onSetPermissionTargetUserId: (next: string) => void;
  onSetCurrentUserId: (next: string) => void;
  onSetSearchQuery: (next: string) => void;
  onSetHistoryFilter: (next: HistoryFilter) => void;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
  onSave: () => void;
  onSelectWorkOrder: (id: string) => void;
  onCreateWorkOrder: ModalProps["createWorkOrder"]["onCreate"];
  onDeleteWorkOrder: (id: string) => void;
  onReorderWorkOrder: (id: string) => void;
  onWorkflowAction: (action: WorkflowAction) => void;
  onUpdateSelectedWorkOrder: (patch: Partial<WorkOrder>) => void;
  onRenameWorkOrderTitle: (nextTitle: string) => void;
  onConfirmOrderRequest: () => void;
  onCloseOrderRequestConfirm: () => void;
  onInventoryApply: ModalProps["inventoryEditor"]["onApply"];
  onCompleteInspection: DetailProps["onCompleteInspection"];
  onApplyRoles: ModalProps["permission"]["onApplyRoles"];
  onOpenManagerAssignModal: () => void;
  onCloseManagerAssignModal: () => void;
  onChangeManager: (managerId: string) => void;
  onOpenAttachmentPicker: () => void;
  onRequestDeleteAttachment: (attachmentId: string) => void;
  onAttachmentDeleteConfirmClose: () => void;
  onAttachmentDeleteConfirm: () => void;
  onCreateMemoThread: SidePanelProps["onCreateMemoThread"];
  onCreateMemoReply: SidePanelProps["onCreateMemoReply"];
  onPromoteMemoAttachment: SidePanelProps["onPromoteMemoAttachment"];
};

type WorkspaceViewModel = {
  sidebarListProps: SidebarListProps;
  detailProps: DetailProps;
  sidePanelProps: SidePanelProps;
  modalProps: ModalProps;
  mobileTopBarProps: MobileTopBarProps;
  mobileDrawerProps: MobileDrawerProps;
};

export function buildWorkspaceViewModel({
  drawerOpen,
  basicInfoOpen,
  materialOpen,
  outsourcingOpen,
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
  searchQuery,
  workOrders,
  workflowStateById,
  selectedId,
  selectedWorkOrder,
  currentWorkflowState,
  currentUser,
  currentRole,
  isAdmin,
  canCreateWorkOrder,
  canSeeAttachments,
  canUploadOfficialAttachments,
  isReviewRequestLocked,
  canChangeManager,
  canSeeProductionSections,
  canSeeCostSections,
  canOpenInventoryEditor,
  currentDisplayStage,
  currentInventoryQuantity,
  filteredHistoryLogs,
  inventoryLogs,
  officialAttachments,
  selectedAttachment,
  outsourcingTotal,
  fabricTotal,
  subsidiaryTotal,
  totalCost,
  unitCost,
  saveStatus,
  lastSavedAt,
  availableActions,
  visibleStages,
  pendingAttachmentDelete,
  canDeleteWorkOrder,
  canDeleteAttachment,
  onSetDrawerOpen,
  onSetBasicInfoOpen,
  onSetMaterialOpen,
  onSetOutsourcingOpen,
  onSetInventoryEditorOpen,
  onSetPermissionModalOpen,
  onSetCreateWorkOrderModalOpen,
  onSetAdminPanelModalOpen,
  onSetInventoryLogModalOpen,
  onSetAttachmentPreviewId,
  onSetPermissionTargetUserId,
  onSetCurrentUserId,
  onSetSearchQuery,
  onSetHistoryFilter,
  onToggleNotificationSetting,
  onSave,
  onSelectWorkOrder,
  onCreateWorkOrder,
  onDeleteWorkOrder,
  onReorderWorkOrder,
  onWorkflowAction,
  onUpdateSelectedWorkOrder,
  onRenameWorkOrderTitle,
  onConfirmOrderRequest,
  onCloseOrderRequestConfirm,
  onInventoryApply,
  onCompleteInspection,
  onApplyRoles,
  onOpenManagerAssignModal,
  onCloseManagerAssignModal,
  onChangeManager,
  onOpenAttachmentPicker,
  onRequestDeleteAttachment,
  onAttachmentDeleteConfirmClose,
  onAttachmentDeleteConfirm,
  onCreateMemoThread,
  onCreateMemoReply,
  onPromoteMemoAttachment,
}: BuildWorkspaceViewModelArgs): WorkspaceViewModel {
  const version = APP_VERSION;
  const canManageListActions = !isInspectorRole(currentUser);

  const sidebarListProps: SidebarListProps = {
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
    canManageListActions,
    searchQuery,
    onSearchQueryChange: onSetSearchQuery,
  };

  const detailProps: DetailProps = {
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

  const sidePanelProps: SidePanelProps = {
    canSeeAttachments,
    canUploadOfficialAttachments,
    attachments: officialAttachments,
    onOpenAttachmentPicker,
    onPreviewAttachment: onSetAttachmentPreviewId,
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

  const modalProps: ModalProps = {
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
      currentUserName: currentUser.name,
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


  const mobileTopBarProps: MobileTopBarProps = {
    version,
    onOpen: () => onSetDrawerOpen(true),
    onOpenSettings: () => onSetPermissionModalOpen(true),
    onOpenAdminPanel: isAdmin ? () => onSetAdminPanelModalOpen(true) : undefined,
  };

  const mobileDrawerProps: MobileDrawerProps = {
    ...sidebarListProps,
    open: drawerOpen,
    onClose: () => onSetDrawerOpen(false),
    onReorder: (id: string) => {
      onReorderWorkOrder(id);
      onSetDrawerOpen(false);
    },
  };

  return {
    sidebarListProps,
    detailProps,
    sidePanelProps,
    modalProps,
    mobileTopBarProps,
    mobileDrawerProps,
  };
}

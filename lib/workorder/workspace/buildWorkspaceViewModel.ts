import type { ComponentProps } from "react";
import SidebarContent from "@/components/layout/SidebarContent";
import MobileDrawer from "@/components/layout/MobileDrawer";
import MobileTopBar from "@/components/layout/MobileTopBar";
import WorkOrderDetail from "@/components/workorder/WorkOrderDetail";
import WorkOrderOverlay from "@/components/workorder/WorkOrderOverlay";
import WorkOrderSidePanel from "@/components/workorder/WorkOrderSidePanel";
import { APP_VERSION } from "@/lib/constants/app";
import {
  applySidePanelPreviewHandler,
  buildDetailProps,
  buildMobileDrawerProps,
  buildMobileTopBarProps,
  buildModalProps,
  buildSidebarListProps,
  buildSidePanelProps,
} from "@/lib/workorder/workspace/workspaceViewModelBuilders";
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

export function buildWorkspaceViewModel(args: BuildWorkspaceViewModelArgs): WorkspaceViewModel {
  const version = APP_VERSION;

  const sidebarListProps = buildSidebarListProps({
    version,
    isAdmin: args.isAdmin,
    currentUser: args.currentUser,
    workOrders: args.workOrders,
    selectedId: args.selectedId,
    workflowStateById: args.workflowStateById,
    canDeleteWorkOrder: args.canDeleteWorkOrder,
    canCreateWorkOrder: args.canCreateWorkOrder,
    searchQuery: args.searchQuery,
    onSelectWorkOrder: args.onSelectWorkOrder,
    onSetCreateWorkOrderModalOpen: args.onSetCreateWorkOrderModalOpen,
    onSetPermissionModalOpen: args.onSetPermissionModalOpen,
    onSetAdminPanelModalOpen: args.onSetAdminPanelModalOpen,
    onReorderWorkOrder: args.onReorderWorkOrder,
    onDeleteWorkOrder: args.onDeleteWorkOrder,
    onSetSearchQuery: args.onSetSearchQuery,
  });

  const detailProps = buildDetailProps({
    version,
    isAdmin: args.isAdmin,
    currentUser: args.currentUser,
    currentRole: args.currentRole,
    selectedWorkOrder: args.selectedWorkOrder,
    currentWorkflowState: args.currentWorkflowState,
    canCreateWorkOrder: args.canCreateWorkOrder,
    canSeeAttachments: args.canSeeAttachments,
    canUploadOfficialAttachments: args.canUploadOfficialAttachments,
    isReviewRequestLocked: args.isReviewRequestLocked,
    canChangeManager: args.canChangeManager,
    canSeeProductionSections: args.canSeeProductionSections,
    canSeeCostSections: args.canSeeCostSections,
    canOpenInventoryEditor: args.canOpenInventoryEditor,
    currentDisplayStage: args.currentDisplayStage,
    currentInventoryQuantity: args.currentInventoryQuantity,
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
    canDeleteAttachment: args.canDeleteAttachment,
    onSave: args.onSave,
    onWorkflowAction: args.onWorkflowAction,
    onUpdateSelectedWorkOrder: args.onUpdateSelectedWorkOrder,
    onRenameWorkOrderTitle: args.onRenameWorkOrderTitle,
    onCompleteInspection: args.onCompleteInspection,
    onOpenManagerAssignModal: args.onOpenManagerAssignModal,
    onOpenAttachmentPicker: args.onOpenAttachmentPicker,
    onRequestDeleteAttachment: args.onRequestDeleteAttachment,
    onCreateMemoThread: args.onCreateMemoThread,
    onCreateMemoReply: args.onCreateMemoReply,
    onPromoteMemoAttachment: args.onPromoteMemoAttachment,
    basicInfoOpen: args.basicInfoOpen,
    materialOpen: args.materialOpen,
    outsourcingOpen: args.outsourcingOpen,
    onSetBasicInfoOpen: args.onSetBasicInfoOpen,
    onSetMaterialOpen: args.onSetMaterialOpen,
    onSetOutsourcingOpen: args.onSetOutsourcingOpen,
    onSetInventoryEditorOpen: args.onSetInventoryEditorOpen,
  });

  const sidePanelProps = applySidePanelPreviewHandler(
    buildSidePanelProps({
      version,
      isAdmin: args.isAdmin,
      currentUser: args.currentUser,
      currentRole: args.currentRole,
      selectedWorkOrder: args.selectedWorkOrder,
      currentWorkflowState: args.currentWorkflowState,
      canCreateWorkOrder: args.canCreateWorkOrder,
      canSeeAttachments: args.canSeeAttachments,
      canUploadOfficialAttachments: args.canUploadOfficialAttachments,
      isReviewRequestLocked: args.isReviewRequestLocked,
      canChangeManager: args.canChangeManager,
      canSeeProductionSections: args.canSeeProductionSections,
      canSeeCostSections: args.canSeeCostSections,
      canOpenInventoryEditor: args.canOpenInventoryEditor,
      currentDisplayStage: args.currentDisplayStage,
      currentInventoryQuantity: args.currentInventoryQuantity,
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
      canDeleteAttachment: args.canDeleteAttachment,
      onSave: args.onSave,
      onWorkflowAction: args.onWorkflowAction,
      onUpdateSelectedWorkOrder: args.onUpdateSelectedWorkOrder,
      onRenameWorkOrderTitle: args.onRenameWorkOrderTitle,
      onCompleteInspection: args.onCompleteInspection,
      onOpenManagerAssignModal: args.onOpenManagerAssignModal,
      onOpenAttachmentPicker: args.onOpenAttachmentPicker,
      onRequestDeleteAttachment: args.onRequestDeleteAttachment,
      onCreateMemoThread: args.onCreateMemoThread,
      onCreateMemoReply: args.onCreateMemoReply,
      onPromoteMemoAttachment: args.onPromoteMemoAttachment,
    }),
    args.onSetAttachmentPreviewId,
  );

  const modalProps = buildModalProps({
    isAdmin: args.isAdmin,
    inventoryEditorOpen: args.inventoryEditorOpen,
    permissionModalOpen: args.permissionModalOpen,
    createWorkOrderModalOpen: args.createWorkOrderModalOpen,
    adminPanelModalOpen: args.adminPanelModalOpen,
    managerAssignModalOpen: args.managerAssignModalOpen,
    inventoryLogModalOpen: args.inventoryLogModalOpen,
    orderRequestConfirmOpen: args.orderRequestConfirmOpen,
    users: args.users,
    currentUserId: args.currentUserId,
    permissionTargetUserId: args.permissionTargetUserId,
    historyFilter: args.historyFilter,
    notificationSettings: args.notificationSettings,
    currentRole: args.currentRole,
    selectedWorkOrder: args.selectedWorkOrder,
    currentInventoryQuantity: args.currentInventoryQuantity,
    filteredHistoryLogs: args.filteredHistoryLogs,
    inventoryLogs: args.inventoryLogs,
    selectedAttachment: args.selectedAttachment,
    pendingAttachmentDelete: args.pendingAttachmentDelete,
    canDeleteAttachment: args.canDeleteAttachment,
    onSetInventoryEditorOpen: args.onSetInventoryEditorOpen,
    onSetPermissionModalOpen: args.onSetPermissionModalOpen,
    onSetCreateWorkOrderModalOpen: args.onSetCreateWorkOrderModalOpen,
    onSetAdminPanelModalOpen: args.onSetAdminPanelModalOpen,
    onSetInventoryLogModalOpen: args.onSetInventoryLogModalOpen,
    onSetAttachmentPreviewId: args.onSetAttachmentPreviewId,
    onSetPermissionTargetUserId: args.onSetPermissionTargetUserId,
    onSetCurrentUserId: args.onSetCurrentUserId,
    onSetHistoryFilter: args.onSetHistoryFilter,
    onToggleNotificationSetting: args.onToggleNotificationSetting,
    onCreateWorkOrder: args.onCreateWorkOrder,
    onConfirmOrderRequest: args.onConfirmOrderRequest,
    onCloseOrderRequestConfirm: args.onCloseOrderRequestConfirm,
    onInventoryApply: args.onInventoryApply,
    onApplyRoles: args.onApplyRoles,
    onCloseManagerAssignModal: args.onCloseManagerAssignModal,
    onChangeManager: args.onChangeManager,
    onRequestDeleteAttachment: args.onRequestDeleteAttachment,
    onAttachmentDeleteConfirmClose: args.onAttachmentDeleteConfirmClose,
    onAttachmentDeleteConfirm: args.onAttachmentDeleteConfirm,
  });

  const mobileTopBarProps = buildMobileTopBarProps({
    version,
    isAdmin: args.isAdmin,
    onSetDrawerOpen: args.onSetDrawerOpen,
    onSetPermissionModalOpen: args.onSetPermissionModalOpen,
    onSetAdminPanelModalOpen: args.onSetAdminPanelModalOpen,
  });

  const mobileDrawerProps = buildMobileDrawerProps({
    drawerOpen: args.drawerOpen,
    sidebarListProps,
    onSetDrawerOpen: args.onSetDrawerOpen,
    onReorderWorkOrder: args.onReorderWorkOrder,
  });

  return {
    sidebarListProps,
    detailProps,
    sidePanelProps,
    modalProps,
    mobileTopBarProps,
    mobileDrawerProps,
  };
}

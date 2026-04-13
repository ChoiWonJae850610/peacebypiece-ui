import { isInspectorRole } from "@/lib/constants/roles";
import type { MobileDrawerProps, MobileTopBarProps, MobileViewModelArgs, SidebarListProps, SidebarViewModelArgs } from "@/lib/workorder/workspace/viewModelTypes";

export function buildSidebarListProps({
  companyName,
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
    companyName,
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

export function buildMobileTopBarProps({
  companyName,
  version,
  isAdmin,
  onSetDrawerOpen,
  onSetPermissionModalOpen,
  onSetAdminPanelModalOpen,
}: Pick<MobileViewModelArgs, "companyName" | "version" | "isAdmin" | "onSetDrawerOpen" | "onSetPermissionModalOpen" | "onSetAdminPanelModalOpen">): MobileTopBarProps {
  return {
    companyName,
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

import { isInspectorRole } from "@/lib/constants/roles";
import type { MobileDrawerProps, MobileTopBarProps, MobileViewModelArgs, SidebarListProps, SidebarViewModelArgs } from "@/lib/workorder/workspace/viewModelTypes";

export function buildSidebarListProps({
  companyName,
  version,
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
  onSetDrawerOpen,
  onSetPermissionModalOpen,
}: Pick<MobileViewModelArgs, "companyName" | "version" | "onSetDrawerOpen" | "onSetPermissionModalOpen">): MobileTopBarProps {
  return {
    companyName,
    version,
    onOpen: () => onSetDrawerOpen(true),
    onOpenSettings: () => onSetPermissionModalOpen(true),
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

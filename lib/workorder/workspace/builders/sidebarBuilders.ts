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
  listStatusFilter,
  listSort,
  onSelectWorkOrder,
  onSetCreateWorkOrderModalOpen,
  onSetPermissionModalOpen,
  onReorderWorkOrder,
  onDeleteWorkOrder,
  onReworkWorkOrder,
  onSetSearchQuery,
  onSetListStatusFilter,
  onSetListSort,
  onResetListControls,
  dbConnectionStatus,
  writeLocked,
  writeLockMessage,
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
    onRework: onReworkWorkOrder,
    canDelete: canDeleteWorkOrder,
    canCreate: canCreateWorkOrder,
    canManageListActions: !isInspectorRole(currentUser),
    searchQuery,
    onSearchQueryChange: onSetSearchQuery,
    statusFilter: listStatusFilter,
    onStatusFilterChange: onSetListStatusFilter,
    sort: listSort,
    onSortChange: onSetListSort,
    onResetListControls,
    dbConnectionStatus,
    writeLocked,
    writeLockMessage,
  };
}

export function buildMobileTopBarProps({
  companyName,
  version,
  onSetDrawerOpen,
  onSetPermissionModalOpen,
  dbConnectionStatus,
}: Pick<MobileViewModelArgs, "companyName" | "version" | "onSetDrawerOpen" | "onSetPermissionModalOpen" | "dbConnectionStatus">): MobileTopBarProps {
  return {
    companyName,
    version,
    onOpen: () => onSetDrawerOpen(true),
    onOpenSettings: () => onSetPermissionModalOpen(true),
    dbConnectionStatus,
  };
}

export function buildMobileDrawerProps({
  drawerOpen,
  sidebarListProps,
  onSetDrawerOpen,
  onReorderWorkOrder,
  onReworkWorkOrder,
}: Pick<MobileViewModelArgs, "drawerOpen" | "sidebarListProps" | "onSetDrawerOpen" | "onReorderWorkOrder" | "onReworkWorkOrder">): MobileDrawerProps {
  return {
    ...sidebarListProps,
    open: drawerOpen,
    onClose: () => onSetDrawerOpen(false),
    onReorder: (id: string) => {
      onReorderWorkOrder(id);
      onSetDrawerOpen(false);
    },
    onRework: (id: string) => {
      onReworkWorkOrder(id);
      onSetDrawerOpen(false);
    },
  };
}

import { ADMIN_WORKSPACE_PERMISSIONS, PERMISSION_GROUPS, type Permission } from "@/lib/permissions";

export type MemberManagementStatus = "planned" | "ready";

export type MemberRolePreviewId = "admin" | "designer" | "inspector" | "inventory";

export type MemberRolePreview = {
  id: MemberRolePreviewId;
  permissionCount: number;
};

export type MemberPermissionCard = {
  id: string;
  permission: Permission;
  status: MemberManagementStatus;
};

export type MemberPermissionGroupPreview = {
  id: string;
  permissionCount: number;
};

export const MEMBER_ROLE_PREVIEWS: readonly MemberRolePreview[] = [
  { id: "admin", permissionCount: 0 },
  { id: "designer", permissionCount: 0 },
  { id: "inspector", permissionCount: 0 },
  { id: "inventory", permissionCount: 0 },
] as const;

export const MEMBER_MANAGEMENT_PERMISSION_CARDS: readonly MemberPermissionCard[] = [
  { id: "workorder", permission: ADMIN_WORKSPACE_PERMISSIONS.workorderAccess, status: "ready" },
  { id: "partners", permission: ADMIN_WORKSPACE_PERMISSIONS.partnerManage, status: "planned" },
  { id: "storage", permission: ADMIN_WORKSPACE_PERMISSIONS.storageManage, status: "planned" },
  { id: "stats", permission: ADMIN_WORKSPACE_PERMISSIONS.statsView, status: "planned" },
  { id: "organization-settings", permission: ADMIN_WORKSPACE_PERMISSIONS.organizationSettingsManage, status: "planned" },
  { id: "standard-units", permission: ADMIN_WORKSPACE_PERMISSIONS.standardUnitManage, status: "planned" },
  { id: "outsourcing-processes", permission: ADMIN_WORKSPACE_PERMISSIONS.outsourcingProcessManage, status: "planned" },
  { id: "product-types", permission: ADMIN_WORKSPACE_PERMISSIONS.productTypeManage, status: "planned" },
] as const;

export function getMemberRolePreviews(): readonly MemberRolePreview[] {
  return MEMBER_ROLE_PREVIEWS;
}

export function getMemberManagementPermissionCards(): readonly MemberPermissionCard[] {
  return MEMBER_MANAGEMENT_PERMISSION_CARDS;
}

export function getMemberPermissionGroupPreviews(): readonly MemberPermissionGroupPreview[] {
  return PERMISSION_GROUPS.map((group) => ({ id: group.key, permissionCount: group.permissions.length }));
}

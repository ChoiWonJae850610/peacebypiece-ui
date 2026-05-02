export type PermissionKey =
  | "workorder.create"
  | "workorder.edit"
  | "workorder.request_review"
  | "workorder.skip_review"
  | "workorder.request_order"
  | "workorder.inspect"
  | "workorder.complete"
  | "inventory.manage"
  | "partner.manage"
  | "member.invite"
  | "billing.manage"
  | "storage.manage"
  | "stats.view"
  | "system.audit.view"
  | string;

export interface PermissionCatalogItem {
  permissionKey: PermissionKey;
  label: string;
  description?: string | null;
  category: string;
  isActive: boolean;
}

export interface RolePermissionMap {
  role: string;
  permissions: PermissionKey[];
}

export interface UserPermissionMap {
  companyUserId: string;
  role: string;
  rolePermissions: PermissionKey[];
  explicitPermissions: PermissionKey[];
  resolvedPermissions: PermissionKey[];
}

export interface PermissionResolutionInput {
  role: string;
  rolePermissions?: PermissionKey[];
  explicitPermissions?: PermissionKey[];
}

export interface PermissionCheckInput {
  permissions: PermissionKey[];
  required: PermissionKey;
}

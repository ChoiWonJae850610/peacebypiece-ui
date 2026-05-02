export const WORKORDER_PERMISSIONS = [
  "workorder.create",
  "workorder.edit",
  "workorder.request_review",
  "workorder.skip_review",
  "workorder.request_order",
  "workorder.inspect",
  "workorder.complete",
] as const;

export const OPERATION_PERMISSIONS = [
  "inventory.manage",
  "partner.manage",
  "member.invite",
  "billing.manage",
  "storage.manage",
] as const;

export const PERMISSIONS = [
  ...WORKORDER_PERMISSIONS,
  ...OPERATION_PERMISSIONS,
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type PermissionRole = "admin" | "designer" | "inspector" | "inventory";

export type PermissionProfile = {
  role: PermissionRole;
  permissions: readonly Permission[];
};

const ADMIN_PERMISSIONS = PERMISSIONS;

const DESIGNER_PERMISSIONS = [
  "workorder.create",
  "workorder.edit",
  "workorder.request_review",
] as const satisfies readonly Permission[];

const INSPECTOR_PERMISSIONS = [
  "workorder.inspect",
  "workorder.complete",
] as const satisfies readonly Permission[];

const INVENTORY_PERMISSIONS = [
  "inventory.manage",
] as const satisfies readonly Permission[];

export const DEFAULT_PERMISSION_PROFILES = {
  admin: {
    role: "admin",
    permissions: ADMIN_PERMISSIONS,
  },
  designer: {
    role: "designer",
    permissions: DESIGNER_PERMISSIONS,
  },
  inspector: {
    role: "inspector",
    permissions: INSPECTOR_PERMISSIONS,
  },
  inventory: {
    role: "inventory",
    permissions: INVENTORY_PERMISSIONS,
  },
} as const satisfies Record<PermissionRole, PermissionProfile>;

export type PermissionInput = {
  role?: PermissionRole | string | null;
  permissions?: readonly (Permission | string)[] | null;
};

export interface PermissionResolutionInput {
  role?: PermissionRole | string | null;
  rolePermissions?: readonly string[] | null;
  explicitPermissions?: readonly string[] | null;
}

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function normalizePermissions(input: PermissionInput): readonly Permission[] {
  const basePermissions =
    input.role && input.role in DEFAULT_PERMISSION_PROFILES
      ? DEFAULT_PERMISSION_PROFILES[input.role as PermissionRole].permissions
      : [];

  const explicitPermissions = (input.permissions ?? []).filter((value): value is Permission =>
    typeof value === "string" && isPermission(value),
  );

  return Array.from(new Set<Permission>([...basePermissions, ...explicitPermissions]));
}

export function resolvePermissions(
  input: PermissionResolutionInput,
): string[] {
  const rolePermissions = input.rolePermissions ?? [];
  const explicitPermissions = input.explicitPermissions ?? [];

  return Array.from(new Set<string>([...rolePermissions, ...explicitPermissions])).sort();
}

export function hasPermission(input: PermissionInput, permission: Permission): boolean {
  return normalizePermissions(input).includes(permission);
}

export function hasEveryPermission(input: PermissionInput, permissions: readonly Permission[]): boolean {
  const normalizedPermissions = normalizePermissions(input);
  return permissions.every((permission) => normalizedPermissions.includes(permission));
}

export function hasSomePermission(input: PermissionInput, permissions: readonly Permission[]): boolean {
  const normalizedPermissions = normalizePermissions(input);
  return permissions.some((permission) => normalizedPermissions.includes(permission));
}

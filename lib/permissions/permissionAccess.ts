import {
  MEMBER_PERMISSION_CATALOG,
  MEMBER_ROLE_TEMPLATE_POLICIES,
  type MemberPermissionCode,
  type MemberPermissionRoleTemplateCode,
} from "./memberPermissionMatrix";

export type MemberPermissionAccessInput = {
  permissionCodes?: readonly (MemberPermissionCode | string)[] | null;
};

export function isMemberPermissionCode(value: string): value is MemberPermissionCode {
  return MEMBER_PERMISSION_CATALOG.some((permission) => permission.code === value);
}

export function normalizeMemberPermissionCodes(input: MemberPermissionAccessInput): readonly MemberPermissionCode[] {
  const permissionCodes = input.permissionCodes ?? [];
  return Array.from(
    new Set(
      permissionCodes.filter((permissionCode): permissionCode is MemberPermissionCode =>
        typeof permissionCode === "string" && isMemberPermissionCode(permissionCode),
      ),
    ),
  );
}

export function hasMemberPermission(input: MemberPermissionAccessInput, permissionCode: MemberPermissionCode): boolean {
  return normalizeMemberPermissionCodes(input).includes(permissionCode);
}

export function hasEveryMemberPermission(input: MemberPermissionAccessInput, permissionCodes: readonly MemberPermissionCode[]): boolean {
  const normalizedPermissions = normalizeMemberPermissionCodes(input);
  return permissionCodes.every((permissionCode) => normalizedPermissions.includes(permissionCode));
}

export function hasSomeMemberPermission(input: MemberPermissionAccessInput, permissionCodes: readonly MemberPermissionCode[]): boolean {
  const normalizedPermissions = normalizeMemberPermissionCodes(input);
  return permissionCodes.some((permissionCode) => normalizedPermissions.includes(permissionCode));
}

export function getMemberRoleTemplatePermissions(roleCode: MemberPermissionRoleTemplateCode): readonly MemberPermissionCode[] {
  return MEMBER_ROLE_TEMPLATE_POLICIES.find((role) => role.code === roleCode)?.permissionCodes ?? [];
}

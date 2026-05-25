import {
  MEMBER_PERMISSION_CATALOG,
  MEMBER_PERMISSION_CODE,
  MEMBER_ROLE_TEMPLATE_POLICIES,
  type MemberPermissionCode,
  type MemberPermissionRoleTemplateCode,
} from "./memberPermissionMatrix";

export type MemberPermissionAccessInput = {
  permissionCodes?: readonly (MemberPermissionCode | string)[] | null;
};

export const DEFAULT_MEMBER_BASE_READ_PERMISSION_CODES = [
  MEMBER_PERMISSION_CODE.workorderRead,
  MEMBER_PERMISSION_CODE.partnerRead,
  MEMBER_PERMISSION_CODE.standardsRead,
  MEMBER_PERMISSION_CODE.statsRead,
  MEMBER_PERMISSION_CODE.storageRead,
  MEMBER_PERMISSION_CODE.personalSettingsManage,
] as const satisfies readonly MemberPermissionCode[];

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


export function mergeDefaultMemberBaseReadPermissions(
  permissionCodes: readonly (MemberPermissionCode | string)[] | null | undefined,
): readonly MemberPermissionCode[] {
  return normalizeMemberPermissionCodes({
    permissionCodes: [...DEFAULT_MEMBER_BASE_READ_PERMISSION_CODES, ...(permissionCodes ?? [])],
  });
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

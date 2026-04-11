import type { PermissionSet, RoleTemplate, RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";

export const ROLE_TEMPLATES: Record<RoleType, RoleTemplate> = {
  "디자이너": {
    role: "디자이너",
    label: "디자이너",
    description: "작업지시 작성, 검토 요청, 발주 요청 중심 역할",
    team: "디자이너",
    permissions: {
      canSeeProductionSections: true,
      canSeeCostSections: false,
      canEditInventory: false,
      canSeeInventoryHistorySection: true,
      canSeeAttachments: true,
      canAssignRoles: false,
    },
  },
  "관리자": {
    role: "관리자",
    label: "관리자",
    description: "전체 승인과 비용, 권한 관리가 가능한 역할",
    team: "관리자",
    permissions: {
      canSeeProductionSections: true,
      canSeeCostSections: true,
      canEditInventory: true,
      canSeeInventoryHistorySection: true,
      canSeeAttachments: true,
      canAssignRoles: true,
    },
  },
  "입고/검수": {
    role: "입고/검수",
    label: "입고/검수",
    description: "입고 등록, 검수 완료, 재고 수정 중심 역할",
    team: "입고/검수",
    permissions: {
      canSeeProductionSections: false,
      canSeeCostSections: false,
      canEditInventory: true,
      canSeeInventoryHistorySection: true,
      canSeeAttachments: true,
      canAssignRoles: false,
    },
  },
};

export const DEFAULT_ROLE: RoleType = "디자이너";
export const ROLE_PRIORITY: readonly RoleType[] = ["관리자", "디자이너", "입고/검수"] as const;
export const WORK_ORDER_CREATOR_ROLES: readonly RoleType[] = ["관리자", "디자이너"] as const;
export const OFFICIAL_ATTACHMENT_MANAGER_ROLES: readonly RoleType[] = ["관리자"] as const;
export const INVENTORY_EDITOR_ROLES: readonly RoleType[] = ["관리자", "입고/검수"] as const;

export const ROLE_OPTIONS = Object.values(ROLE_TEMPLATES).map((item) => ({
  role: item.role,
  title: item.label,
  description: item.description,
}));

export const ROLE_DISPLAY_GUIDE = ROLE_PRIORITY.map((role) => ({
  role,
  title: ROLE_TEMPLATES[role].label,
  description: ROLE_TEMPLATES[role].description,
}));

export function isRoleType(value: unknown): value is RoleType {
  return value === "디자이너" || value === "관리자" || value === "입고/검수";
}

export function normalizeRoles(roles?: readonly RoleType[] | null, fallback?: RoleType | null): RoleType[] {
  const next = Array.from(
    new Set(
      [...(roles ?? []), ...(fallback ? [fallback] : [])].filter((value): value is RoleType => isRoleType(value)),
    ),
  );
  if (next.length > 0) return next;
  return [fallback ?? DEFAULT_ROLE];
}

export function getPrimaryRole(roles?: readonly RoleType[] | null, fallback?: RoleType | null): RoleType {
  const normalized = normalizeRoles(roles, fallback);
  return ROLE_PRIORITY.find((role) => normalized.includes(role)) ?? normalized[0] ?? DEFAULT_ROLE;
}

export function getPermissionsFromRoles(roles?: readonly RoleType[] | null, fallback?: RoleType | null): PermissionSet {
  const normalized = normalizeRoles(roles, fallback);
  return normalized.reduce<PermissionSet>(
    (acc, role) => {
      const permissions = ROLE_TEMPLATES[role].permissions;
      return {
        canSeeProductionSections: acc.canSeeProductionSections || permissions.canSeeProductionSections,
        canSeeCostSections: acc.canSeeCostSections || permissions.canSeeCostSections,
        canEditInventory: acc.canEditInventory || permissions.canEditInventory,
        canSeeInventoryHistorySection: acc.canSeeInventoryHistorySection || permissions.canSeeInventoryHistorySection,
        canSeeAttachments: acc.canSeeAttachments || permissions.canSeeAttachments,
        canAssignRoles: acc.canAssignRoles || permissions.canAssignRoles,
      };
    },
    {
      canSeeProductionSections: false,
      canSeeCostSections: false,
      canEditInventory: false,
      canSeeInventoryHistorySection: false,
      canSeeAttachments: false,
      canAssignRoles: false,
    },
  );
}

export function hasRole(source: readonly RoleType[] | Pick<UserProfile, "role" | "roles">, role: RoleType): boolean {
  const roles = Array.isArray(source)
    ? source
    : normalizeRoles((source as Pick<UserProfile, "role" | "roles">).roles, (source as Pick<UserProfile, "role" | "roles">).role);
  return roles.includes(role);
}

export function hasAnyRole(source: readonly RoleType[] | Pick<UserProfile, "role" | "roles">, targetRoles: readonly RoleType[]): boolean {
  const roles = Array.isArray(source)
    ? normalizeRoles(source)
    : normalizeRoles((source as Pick<UserProfile, "role" | "roles">).roles, (source as Pick<UserProfile, "role" | "roles">).role);
  return targetRoles.some((role) => roles.includes(role));
}

export function isAdminRole(source: readonly RoleType[] | Pick<UserProfile, "role" | "roles">) {
  return hasRole(source, "관리자");
}

export function isDesignerRole(source: readonly RoleType[] | Pick<UserProfile, "role" | "roles">) {
  return hasRole(source, "디자이너");
}

export function isInspectorRole(source: readonly RoleType[] | Pick<UserProfile, "role" | "roles">) {
  return hasRole(source, "입고/검수");
}

export function canCreateWorkOrderByRoles(source: readonly RoleType[] | Pick<UserProfile, "role" | "roles">) {
  return hasAnyRole(source, WORK_ORDER_CREATOR_ROLES);
}

export function canUploadOfficialAttachmentsByRoles(source: readonly RoleType[] | Pick<UserProfile, "role" | "roles">) {
  return hasAnyRole(source, OFFICIAL_ATTACHMENT_MANAGER_ROLES);
}

export function canEditInventoryByRoles(source: readonly RoleType[] | Pick<UserProfile, "role" | "roles">) {
  return hasAnyRole(source, INVENTORY_EDITOR_ROLES);
}

export function formatRoles(roles?: readonly RoleType[] | null, fallback?: RoleType | null): string {
  return normalizeRoles(roles, fallback).join(" · ");
}

export function buildUserRoleState(roles?: readonly RoleType[] | null, fallback?: RoleType | null) {
  const normalized = normalizeRoles(roles, fallback);
  return {
    roles: normalized,
    role: getPrimaryRole(normalized, fallback),
    team: getPrimaryRole(normalized, fallback),
    permissions: getPermissionsFromRoles(normalized, fallback),
  };
}

export function getPermissionSummary(user: Pick<UserProfile, "role" | "team" | "roles">): string {
  return formatRoles(user.roles, user.role ?? user.team);
}

export const INITIAL_USERS: UserProfile[] = [
  {
    id: "user-designer",
    name: "김디자이너",
    ...buildUserRoleState(["디자이너"]),
  },
  {
    id: "user-admin",
    name: "박관리",
    ...buildUserRoleState(["관리자"]),
  },
  {
    id: "user-inspection",
    name: "이검수",
    ...buildUserRoleState(["입고/검수"]),
  },
];

export const ROLE_PRESETS = ROLE_TEMPLATES;

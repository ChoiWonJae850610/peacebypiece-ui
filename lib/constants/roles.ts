import type { PermissionSet, RoleTemplate, RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/user";

export const ROLE = {
  designer: "designer",
  admin: "admin",
  inspector: "inspector",
} as const satisfies Record<string, RoleType>;

export const ROLE_LABELS: Record<RoleType, string> = {
  [ROLE.designer]: "디자이너",
  [ROLE.admin]: "관리자",
  [ROLE.inspector]: "재고관리",
};

export const LEGACY_ROLE_MAP = {
  디자이너: ROLE.designer,
  관리자: ROLE.admin,
  "입고/검수": ROLE.inspector,
  "재고관리": ROLE.inspector,
} as const;

export const ROLE_TEMPLATES: Record<RoleType, RoleTemplate> = {
  [ROLE.designer]: {
    role: ROLE.designer,
    label: ROLE_LABELS[ROLE.designer],
    description: "작업지시 작성, 검토 요청, 발주 요청 중심 역할",
    team: ROLE.designer,
    permissions: {
      canSeeProductionSections: true,
      canSeeCostSections: false,
      canEditInventory: false,
      canSeeInventoryHistorySection: true,
      canSeeAttachments: true,
      canAssignRoles: false,
    },
  },
  [ROLE.admin]: {
    role: ROLE.admin,
    label: ROLE_LABELS[ROLE.admin],
    description: "전체 승인과 비용, 권한 관리가 가능한 역할",
    team: ROLE.admin,
    permissions: {
      canSeeProductionSections: true,
      canSeeCostSections: true,
      canEditInventory: true,
      canSeeInventoryHistorySection: true,
      canSeeAttachments: true,
      canAssignRoles: true,
    },
  },
  [ROLE.inspector]: {
    role: ROLE.inspector,
    label: ROLE_LABELS[ROLE.inspector],
    description: "입고 등록, 검수 완료, 재고 수정 중심 역할",
    team: ROLE.inspector,
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

export const DEFAULT_ROLE: RoleType = ROLE.designer;
export const ROLE_PRIORITY: readonly RoleType[] = [ROLE.admin, ROLE.designer, ROLE.inspector] as const;
export const WORK_ORDER_CREATOR_ROLES: readonly RoleType[] = [ROLE.admin, ROLE.designer] as const;
export const OFFICIAL_ATTACHMENT_MANAGER_ROLES: readonly RoleType[] = [ROLE.admin, ROLE.designer] as const;
export const INVENTORY_EDITOR_ROLES: readonly RoleType[] = [ROLE.admin, ROLE.inspector] as const;

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
  return value === ROLE.designer || value === ROLE.admin || value === ROLE.inspector;
}

export function toRoleType(value: unknown): RoleType | null {
  if (isRoleType(value)) return value;
  if (typeof value === "string" && value in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[value as keyof typeof LEGACY_ROLE_MAP];
  return null;
}

export function getRoleLabel(role: RoleType): string {
  return ROLE_LABELS[role];
}

export function normalizeRoles(roles?: readonly (RoleType | string)[] | null, fallback?: RoleType | string | null): RoleType[] {
  const next = Array.from(
    new Set(
      [...(roles ?? []), ...(fallback ? [fallback] : [])]
        .map((value) => toRoleType(value))
        .filter((value): value is RoleType => value !== null),
    ),
  );
  if (next.length > 0) return next;
  const fallbackRole = toRoleType(fallback) ?? DEFAULT_ROLE;
  return [fallbackRole];
}

export function getPrimaryRole(roles?: readonly (RoleType | string)[] | null, fallback?: RoleType | string | null): RoleType {
  const normalized = normalizeRoles(roles, fallback);
  return ROLE_PRIORITY.find((role) => normalized.includes(role)) ?? normalized[0] ?? DEFAULT_ROLE;
}

export function getPermissionsFromRoles(roles?: readonly (RoleType | string)[] | null, fallback?: RoleType | string | null): PermissionSet {
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

export function hasRole(source: readonly (RoleType | string)[] | Pick<UserProfile, "role" | "roles">, role: RoleType): boolean {
  const roles = Array.isArray(source)
    ? normalizeRoles(source)
    : normalizeRoles((source as Pick<UserProfile, "role" | "roles">).roles, (source as Pick<UserProfile, "role" | "roles">).role);
  return roles.includes(role);
}

export function hasAnyRole(source: readonly (RoleType | string)[] | Pick<UserProfile, "role" | "roles">, targetRoles: readonly RoleType[]): boolean {
  const roles = Array.isArray(source)
    ? normalizeRoles(source)
    : normalizeRoles((source as Pick<UserProfile, "role" | "roles">).roles, (source as Pick<UserProfile, "role" | "roles">).role);
  return targetRoles.some((role) => roles.includes(role));
}

export function isAdminRole(source: readonly (RoleType | string)[] | Pick<UserProfile, "role" | "roles">) {
  return hasRole(source, ROLE.admin);
}

export function isDesignerRole(source: readonly (RoleType | string)[] | Pick<UserProfile, "role" | "roles">) {
  return hasRole(source, ROLE.designer);
}

export function isInspectorRole(source: readonly (RoleType | string)[] | Pick<UserProfile, "role" | "roles">) {
  return hasRole(source, ROLE.inspector);
}

export function canCreateWorkOrderByRoles(source: readonly (RoleType | string)[] | Pick<UserProfile, "role" | "roles">) {
  return hasAnyRole(source, WORK_ORDER_CREATOR_ROLES);
}

export function canUploadOfficialAttachmentsByRoles(source: readonly (RoleType | string)[] | Pick<UserProfile, "role" | "roles">) {
  return hasAnyRole(source, OFFICIAL_ATTACHMENT_MANAGER_ROLES);
}

export function canEditInventoryByRoles(source: readonly (RoleType | string)[] | Pick<UserProfile, "role" | "roles">) {
  return hasAnyRole(source, INVENTORY_EDITOR_ROLES);
}

export function formatRoles(roles?: readonly (RoleType | string)[] | null, fallback?: RoleType | string | null): string {
  return normalizeRoles(roles, fallback).map(getRoleLabel).join(" · ");
}

export function buildUserRoleState(roles?: readonly (RoleType | string)[] | null, fallback?: RoleType | string | null) {
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
    ...buildUserRoleState([ROLE.designer]),
  },
  {
    id: "user-admin",
    name: "박관리",
    ...buildUserRoleState([ROLE.admin]),
  },
  {
    id: "user-inspection",
    name: "이검수",
    ...buildUserRoleState([ROLE.inspector]),
  },
];

export const ROLE_PRESETS = ROLE_TEMPLATES;

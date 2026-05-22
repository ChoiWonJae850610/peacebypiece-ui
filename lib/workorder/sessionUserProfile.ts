import { buildUserRoleState } from "@/lib/constants/roles";
import type { RoleType } from "@/types/permission";
import type { UserProfile } from "@/types/workorder";

export type WorkOrderSessionUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  roleTemplateCode?: string | null;
  companyMemberId?: string | null;
  permissionCodes?: readonly string[] | null;
};

const SESSION_ROLE_TEMPLATE_TO_WORKORDER_ROLE: Record<string, RoleType | null> = {
  company_admin: "admin",
  designer: "designer",
  inspector: "inspector",
  inventory_manager: "inspector",
  viewer: null,
};

export function normalizeSessionPermissionCodes(
  permissionCodes: readonly string[] | null | undefined,
): readonly string[] {
  if (!Array.isArray(permissionCodes)) return [];

  return Array.from(
    new Set(
      permissionCodes
        .map((permissionCode) => String(permissionCode ?? "").trim())
        .filter(Boolean),
    ),
  );
}

export function resolveWorkOrderRoleFromSession(
  sessionUser: WorkOrderSessionUser | null | undefined,
): RoleType {
  const roleTemplateCode = sessionUser?.roleTemplateCode?.trim();
  if (roleTemplateCode && roleTemplateCode in SESSION_ROLE_TEMPLATE_TO_WORKORDER_ROLE) {
    return SESSION_ROLE_TEMPLATE_TO_WORKORDER_ROLE[roleTemplateCode] ?? "designer";
  }

  return sessionUser?.role === "company_admin" || sessionUser?.role === "system_admin"
    ? "admin"
    : "designer";
}

export function createWorkOrderSessionProfile(
  sessionUser: WorkOrderSessionUser | null | undefined,
): UserProfile | null {
  if (!sessionUser?.id) return null;

  const role = resolveWorkOrderRoleFromSession(sessionUser);

  return {
    id: sessionUser.id,
    companyMemberId: sessionUser.companyMemberId?.trim() || null,
    name: sessionUser.name?.trim() || sessionUser.email?.trim() || sessionUser.id,
    permissionCodes: normalizeSessionPermissionCodes(sessionUser.permissionCodes),
    ...buildUserRoleState([role]),
  };
}

export function mergeWorkOrderSessionProfile(
  user: UserProfile,
  sessionProfile: UserProfile,
): UserProfile {
  return {
    ...user,
    id: sessionProfile.id,
    companyMemberId: sessionProfile.companyMemberId ?? user.companyMemberId ?? null,
    name: sessionProfile.name || user.name,
    permissionCodes: sessionProfile.permissionCodes ?? [],
    role: sessionProfile.role,
    team: sessionProfile.team,
    roles: sessionProfile.roles,
    permissions: sessionProfile.permissions,
  };
}

export function ensureWorkOrderSessionProfile(
  users: UserProfile[],
  sessionProfile: UserProfile | null,
): UserProfile[] {
  if (!sessionProfile?.id) return users;

  const matchedIndex = users.findIndex((user) =>
    user.id === sessionProfile.id ||
    Boolean(sessionProfile.companyMemberId && user.companyMemberId === sessionProfile.companyMemberId),
  );

  if (matchedIndex >= 0) {
    return users.map((user, index) =>
      index === matchedIndex ? mergeWorkOrderSessionProfile(user, sessionProfile) : user,
    );
  }

  return [sessionProfile, ...users];
}

export function mergeCurrentUserWithSessionProfile(
  currentUser: UserProfile,
  sessionProfile: UserProfile | null,
): UserProfile {
  if (!sessionProfile?.id) return currentUser;

  return {
    ...currentUser,
    ...sessionProfile,
    companyMemberId: sessionProfile.companyMemberId ?? currentUser.companyMemberId ?? null,
    name: sessionProfile.name || currentUser.name,
    permissionCodes: sessionProfile.permissionCodes ?? [],
  };
}

export function resolveWorkOrderSessionUserId(sessionProfile: UserProfile | null): string {
  return sessionProfile?.id ?? "";
}

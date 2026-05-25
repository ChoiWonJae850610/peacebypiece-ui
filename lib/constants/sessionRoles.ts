import type { WaflSessionRole } from "@/lib/auth/session";

export const SESSION_ROLE = {
  companyAdmin: "company_admin",
  member: "member",
  systemAdmin: "system_admin",
} as const satisfies Record<string, WaflSessionRole>;

export const WAFL_SESSION_ROLES = [
  SESSION_ROLE.companyAdmin,
  SESSION_ROLE.member,
  SESSION_ROLE.systemAdmin,
] as const satisfies readonly WaflSessionRole[];

export type WaflSessionRoleValue = (typeof WAFL_SESSION_ROLES)[number];

export function isWaflSessionRole(value: unknown): value is WaflSessionRole {
  return typeof value === "string" && (WAFL_SESSION_ROLES as readonly string[]).includes(value);
}

export function isSystemAdminSessionRole(role: WaflSessionRole): boolean {
  return role === SESSION_ROLE.systemAdmin;
}

export function isCompanyAdminSessionRole(role: WaflSessionRole): boolean {
  return role === SESSION_ROLE.companyAdmin;
}

export function isMemberSessionRole(role: WaflSessionRole): boolean {
  return role === SESSION_ROLE.member;
}

export function isWorkspaceSessionRole(role: WaflSessionRole): boolean {
  return isCompanyAdminSessionRole(role) || isMemberSessionRole(role);
}

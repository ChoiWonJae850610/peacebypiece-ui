import { ROLE } from "@/lib/constants/roles";
import type { RoleType } from "@/types/permission";

export const WORKSPACE_HOME_ROUTES = {
  customerAdmin: "/admin",
  member: "/workspace",
  systemAdmin: "/system",
} as const;

export type WorkspaceHomeRoute =
  (typeof WORKSPACE_HOME_ROUTES)[keyof typeof WORKSPACE_HOME_ROUTES];

export function getWorkspaceHomeRouteByRole(
  role: RoleType | null | undefined,
): WorkspaceHomeRoute {
  if (role === ROLE.admin) return WORKSPACE_HOME_ROUTES.customerAdmin;
  return WORKSPACE_HOME_ROUTES.member;
}

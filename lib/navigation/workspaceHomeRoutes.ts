import { ROLE } from "@/lib/constants/roles";
import type { RoleType } from "@/types/permission";

export const WORKSPACE_HOME_ROUTES = {
  customerAdmin: "/admin",
  member: "/workspace",
  systemAdmin: "/system",
} as const;

export type WorkspaceHomeRoute =
  (typeof WORKSPACE_HOME_ROUTES)[keyof typeof WORKSPACE_HOME_ROUTES];

export const WORKSPACE_HOME_TARGET = {
  customerAdmin: "customerAdmin",
  member: "member",
  systemAdmin: "systemAdmin",
} as const;

export type WorkspaceHomeTarget =
  (typeof WORKSPACE_HOME_TARGET)[keyof typeof WORKSPACE_HOME_TARGET];

export type WorkspaceHomeNavigationLabels = Record<
  Exclude<WorkspaceHomeTarget, "systemAdmin">,
  string
> &
  Partial<Record<"systemAdmin", string>>;

export type WorkspaceHomeNavigationCopy = {
  fallbackLabel: string;
  fallbackAriaLabel: string;
  targetLabels: WorkspaceHomeNavigationLabels;
  targetAriaLabels: WorkspaceHomeNavigationLabels;
};

export type WorkspaceHomeNavigation = {
  href: WorkspaceHomeRoute;
  target: WorkspaceHomeTarget;
  label: string;
  ariaLabel: string;
};

export function getWorkspaceHomeTargetByRole(
  role: RoleType | null | undefined,
): WorkspaceHomeTarget {
  if (role === ROLE.admin) return WORKSPACE_HOME_TARGET.customerAdmin;
  return WORKSPACE_HOME_TARGET.member;
}

export function getWorkspaceHomeRouteByTarget(
  target: WorkspaceHomeTarget,
): WorkspaceHomeRoute {
  return WORKSPACE_HOME_ROUTES[target];
}

export function getWorkspaceHomeRouteByRole(
  role: RoleType | null | undefined,
): WorkspaceHomeRoute {
  return getWorkspaceHomeRouteByTarget(getWorkspaceHomeTargetByRole(role));
}

export function buildWorkspaceHomeNavigation(
  role: RoleType | null | undefined,
  copy: WorkspaceHomeNavigationCopy,
): WorkspaceHomeNavigation {
  const target = getWorkspaceHomeTargetByRole(role);

  return {
    href: getWorkspaceHomeRouteByTarget(target),
    target,
    label: copy.targetLabels[target] ?? copy.fallbackLabel,
    ariaLabel: copy.targetAriaLabels[target] ?? copy.fallbackAriaLabel,
  };
}

export type WorkspaceDashboardRoute = string | null;
export type WorkspaceNavigationRole = "company_admin" | "member" | "system_admin";

export type WorkspaceNavigationItem = {
  label: string;
  href: WorkspaceDashboardRoute;
  icon: string;
  translationKey?: "dashboard" | "workorder" | "partners" | "storage" | "statistics" | "settings";
  active?: boolean;
};

export const WORKSPACE_NAVIGATION_ITEMS: WorkspaceNavigationItem[] = [
  { label: "대시보드", href: "/workspace", icon: "dashboard", translationKey: "dashboard" },
  { label: "작업지시서", href: "/workspace/workorders", icon: "workorder", translationKey: "workorder" },
  { label: "원단·부자재", href: "/workspace/material-orders", icon: "materials" },
  { label: "협력업체 관리", href: "/workspace/partners", icon: "partners", translationKey: "partners" },
  { label: "통계정보", href: "/workspace/stats", icon: "statistics", translationKey: "statistics" },
  { label: "기준정보", href: "/workspace/standards", icon: "standards" },
  { label: "저장소 관리", href: "/workspace/files", icon: "storage", translationKey: "storage" },
  { label: "환경설정", href: "/workspace/settings", icon: "settings", translationKey: "settings" },
];

export type WorkspaceNavigationOptions = {
  role?: WorkspaceNavigationRole | null;
};

function canShowWorkspaceNavigationItem(
  item: WorkspaceNavigationItem,
  options: WorkspaceNavigationOptions,
): boolean {
  if (item.href === "/workspace/settings" && options.role === "member") {
    return false;
  }

  return true;
}

export function getWorkspaceNavigationItems(
  activeHref: string,
  options: WorkspaceNavigationOptions = {},
): WorkspaceNavigationItem[] {
  return WORKSPACE_NAVIGATION_ITEMS.filter((item) => canShowWorkspaceNavigationItem(item, options)).map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}

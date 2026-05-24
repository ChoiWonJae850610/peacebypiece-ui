export type WorkspaceDashboardRoute = string | null;

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
  { label: "협력업체 관리", href: "/workspace/partners", icon: "partners", translationKey: "partners" },
  { label: "저장소 관리", href: "/workspace/files", icon: "storage", translationKey: "storage" },
  { label: "통계정보", href: "/workspace/stats", icon: "statistics", translationKey: "statistics" },
  { label: "환경설정", href: "/workspace/settings", icon: "settings", translationKey: "settings" },
];

export function getWorkspaceNavigationItems(activeHref: string): WorkspaceNavigationItem[] {
  return WORKSPACE_NAVIGATION_ITEMS.map((item) => ({
    ...item,
    active: item.href === activeHref,
  }));
}

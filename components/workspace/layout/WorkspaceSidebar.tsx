"use client";

import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import type { WorkspaceNavigationItem } from "@/lib/navigation/workspaceNavigation";

type WorkspaceSidebarProps = {
  companyName: string;
  appVersion: string;
  navigationItems: WorkspaceNavigationItem[];
};

export default function WorkspaceSidebar({
  companyName,
  appVersion,
  navigationItems,
}: WorkspaceSidebarProps) {
  return (
    <AdminSidebar
      companyName={companyName}
      appVersion={appVersion}
      navigationItems={navigationItems}
    />
  );
}

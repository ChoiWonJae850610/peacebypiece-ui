"use client";

import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import type { WorkspaceNavigationItem } from "@/lib/navigation/workspaceNavigation";

type WorkspaceTopbarProps = {
  companyName: string;
  appVersion: string;
  title: string;
  description?: string;
  navigationItems?: WorkspaceNavigationItem[];
};

export default function WorkspaceTopbar({
  companyName,
  appVersion,
  title,
  description,
}: WorkspaceTopbarProps) {
  return (
    <AdminTopbar
      companyName={companyName}
      appVersion={appVersion}
      title={title}
      description={description}
    />
  );
}

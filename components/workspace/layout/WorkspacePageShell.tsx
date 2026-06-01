import type { ReactNode } from "react";

import WorkspaceShell, { type WorkspaceShellContentMode } from "@/components/workspace/layout/WorkspaceShell";
import type { WaflSessionPayload } from "@/lib/auth/session";
import { APP_VERSION } from "@/lib/constants/app";
import { getWorkspaceNavigationItems, type WorkspaceDashboardRoute } from "@/lib/navigation/workspaceNavigation";

type WorkspacePageShellSession = Pick<WaflSessionPayload, "companyName" | "role">;

type WorkspacePageShellProps = {
  session: WorkspacePageShellSession;
  activeHref: NonNullable<WorkspaceDashboardRoute>;
  title: string;
  description?: string;
  companyName?: string | null;
  contentMode?: WorkspaceShellContentMode;
  children: ReactNode;
};

export default function WorkspacePageShell({
  session,
  activeHref,
  title,
  description,
  companyName,
  contentMode,
  children,
}: WorkspacePageShellProps) {
  return (
    <WorkspaceShell
      companyName={companyName ?? session.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems(activeHref, { role: session.role })}
      title={title}
      description={description}
      contentMode={contentMode}
    >
      {children}
    </WorkspaceShell>
  );
}

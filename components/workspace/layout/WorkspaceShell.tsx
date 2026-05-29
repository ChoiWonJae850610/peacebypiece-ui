import type { ReactNode } from "react";

import AdminThemeScope from "@/components/admin/layout/AdminThemeScope";
import WorkspaceTopbar from "@/components/workspace/layout/WorkspaceTopbar";
import type { WorkspaceNavigationItem } from "@/lib/navigation/workspaceNavigation";

type WorkspaceShellProps = {
  companyName: string;
  appVersion: string;
  navigationItems?: WorkspaceNavigationItem[];
  title: string;
  description?: string;
  children: ReactNode;
  contentMode?: "scroll" | "fixed-md";
};

export default function WorkspaceShell({
  companyName,
  appVersion,
  navigationItems = [],
  title,
  description,
  children,
  contentMode = "scroll",
}: WorkspaceShellProps) {
  const isFixedFromDesktop = contentMode === "fixed-md";
  const contentFrameClassName = isFixedFromDesktop
    ? "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0 sm:pr-1 lg:overflow-hidden"
    : "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0 sm:pr-1";
  const contentInnerClassName = isFixedFromDesktop
    ? "flex min-h-full flex-col gap-3 pb-2 sm:gap-4 lg:h-full lg:min-h-0 lg:gap-0 lg:pb-0"
    : "flex min-h-full flex-col gap-3 pb-2 sm:gap-4 md:gap-5";

  return (
    <AdminThemeScope>
      <main className="fixed inset-0 overflow-hidden bg-[var(--pbp-bg-app)] p-3 text-[var(--pbp-text-primary)] sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 overflow-hidden sm:gap-4 md:gap-5">
          <WorkspaceTopbar
            companyName={companyName}
            appVersion={appVersion}
            title={title}
            description={description}
            navigationItems={navigationItems}
          />
          <div className={contentFrameClassName}>
            <div className={contentInnerClassName}>{children}</div>
          </div>
        </div>
      </main>
    </AdminThemeScope>
  );
}

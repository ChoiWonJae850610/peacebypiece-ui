import type { ReactNode } from "react";

import AdminThemeScope from "@/components/admin/layout/AdminThemeScope";
import WorkspaceTopbar from "@/components/workspace/layout/WorkspaceTopbar";
import type { WorkspaceNavigationItem } from "@/lib/navigation/workspaceNavigation";

export type WorkspaceShellContentMode = "scroll" | "fixed-md";

type WorkspaceShellProps = {
  companyName: string;
  appVersion: string;
  navigationItems?: WorkspaceNavigationItem[];
  title: string;
  description?: string;
  children: ReactNode;
  contentMode?: WorkspaceShellContentMode;
  hideTopbar?: boolean;
};

export default function WorkspaceShell({
  companyName,
  appVersion,
  navigationItems = [],
  title,
  description,
  children,
  contentMode = "scroll",
  hideTopbar = false,
}: WorkspaceShellProps) {
  const isFixedFromDesktop = contentMode === "fixed-md";
  const contentFrameClassName = isFixedFromDesktop
    ? "w-full touch-pan-y overflow-visible overscroll-auto lg:min-h-0 lg:flex-1 lg:overflow-hidden"
    : "w-full min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain";
  const contentInnerClassName = isFixedFromDesktop
    ? "flex w-full flex-col gap-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:gap-4 lg:h-full lg:min-h-0 lg:gap-0 lg:pb-0"
    : "flex w-full flex-col gap-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:gap-4 md:gap-5";

  return (
    <AdminThemeScope>
      <main className={`min-h-screen touch-pan-y bg-[var(--pbp-bg-app)] p-3 text-[var(--pbp-text-primary)] sm:p-4 md:p-6 lg:p-8 ${isFixedFromDesktop ? "overflow-visible overscroll-auto lg:h-dvh lg:overflow-hidden" : "h-dvh overflow-hidden"}`}>
        <div className={`mx-auto flex h-full min-h-0 w-full max-w-[1480px] flex-col gap-3 sm:gap-4 md:gap-5 ${isFixedFromDesktop ? "overflow-visible lg:overflow-hidden" : "overflow-hidden"}`}>
          {hideTopbar ? null : (
            <WorkspaceTopbar
              companyName={companyName}
              appVersion={appVersion}
              title={title}
              description={description}
              navigationItems={navigationItems}
            />
          )}
          <div className={contentFrameClassName} data-workspace-scroll-frame="true">
            <div className={contentInnerClassName}>{children}</div>
          </div>
        </div>
      </main>
    </AdminThemeScope>
  );
}

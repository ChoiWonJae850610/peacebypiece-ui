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
    ? "min-h-0 flex-1 touch-pan-y overflow-visible overscroll-auto pr-0 sm:pr-1 xl:overflow-hidden"
    : "min-h-0 flex-1 touch-pan-y overflow-visible overscroll-auto pr-0 sm:pr-1 xl:overflow-y-auto xl:overscroll-contain";
  const contentInnerClassName = isFixedFromDesktop
    ? "flex min-h-full flex-col gap-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:gap-4 xl:h-full xl:min-h-0 xl:gap-0 xl:pb-0"
    : "flex min-h-full flex-col gap-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:gap-4 md:gap-5";

  return (
    <AdminThemeScope>
      <main className="fixed inset-0 touch-pan-y overflow-y-auto overscroll-contain bg-[var(--pbp-bg-app)] p-3 text-[var(--pbp-text-primary)] sm:p-4 md:p-6 xl:overflow-hidden xl:p-8">
        <div className="mx-auto flex min-h-full w-full max-w-[1480px] flex-col gap-3 overflow-visible sm:gap-4 md:gap-5 xl:h-full xl:overflow-hidden">
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

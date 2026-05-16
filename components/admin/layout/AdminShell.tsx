import type { ReactNode } from "react";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import AdminThemeScope from "@/components/admin/layout/AdminThemeScope";
import type { AdminNavigationItem } from "@/lib/admin/adminDashboard.presentation";

type AdminShellProps = {
  companyName: string;
  appVersion: string;
  navigationItems?: AdminNavigationItem[];
  title: string;
  description?: string;
  children: ReactNode;
  contentMode?: "scroll" | "fixed-md";
};

export default function AdminShell({ companyName, appVersion, title, description, children, contentMode = "scroll" }: AdminShellProps) {
  const isFixedFromDesktop = contentMode === "fixed-md";
  const contentFrameClassName = isFixedFromDesktop
    ? "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0 sm:pr-1 md:overflow-hidden"
    : "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0 sm:pr-1";
  const contentInnerClassName = isFixedFromDesktop
    ? "flex min-h-full flex-col gap-3 pb-2 sm:gap-4 md:h-full md:min-h-0 md:gap-0 md:pb-0"
    : "flex min-h-full flex-col gap-3 pb-2 sm:gap-4 md:gap-5";

  return (
    <AdminThemeScope>
      <main className="fixed inset-0 overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#f5f5f4_45%,#eef2ff_100%)] p-3 text-stone-900 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 overflow-hidden sm:gap-4 md:gap-5">
          <AdminTopbar companyName={companyName} appVersion={appVersion} title={title} description={description} />
          <div className={contentFrameClassName}>
            <div className={contentInnerClassName}>{children}</div>
          </div>
        </div>
      </main>
    </AdminThemeScope>
  );
}

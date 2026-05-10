import type { ReactNode } from "react";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import AdminThemeScope from "@/components/admin/layout/AdminThemeScope";
import type { AdminNavigationItem } from "@/lib/admin/adminDashboard.presentation";
import { DEFAULT_LOCALE, I18nProvider } from "@/lib/i18n";

type AdminShellProps = {
  companyName: string;
  appVersion: string;
  navigationItems?: AdminNavigationItem[];
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AdminShell({ companyName, appVersion, title, description, children }: AdminShellProps) {
  return (
    <I18nProvider initialLocale={DEFAULT_LOCALE}>
      <AdminThemeScope>
        <main className="fixed inset-0 overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#f5f5f4_45%,#eef2ff_100%)] p-5 text-stone-900 md:p-6 lg:p-8">
          <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-4 overflow-hidden md:gap-5">
            <AdminTopbar companyName={companyName} appVersion={appVersion} title={title} description={description} />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              <div className="flex min-h-full flex-col gap-5 pb-2">{children}</div>
            </div>
          </div>
        </main>
      </AdminThemeScope>
    </I18nProvider>
  );
}

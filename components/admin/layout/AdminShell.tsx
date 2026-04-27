import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import type { AdminNavigationItem } from "@/lib/admin/adminDashboard.presentation";

type AdminShellProps = {
  companyName: string;
  appVersion: string;
  navigationItems: AdminNavigationItem[];
  title: string;
  description: string;
  children: ReactNode;
};

export default function AdminShell({ companyName, appVersion, navigationItems, title, description, children }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#f5f5f4_45%,#eef2ff_100%)] px-4 py-5 text-stone-900 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 lg:flex-row">
        <AdminSidebar companyName={companyName} appVersion={appVersion} navigationItems={navigationItems} />
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <AdminTopbar title={title} description={description} />
          {children}
        </div>
      </div>
    </main>
  );
}

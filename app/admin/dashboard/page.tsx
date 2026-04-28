import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import { ADMIN_DASHBOARD_PLACEHOLDERS, ADMIN_STAT_SUMMARIES, getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminDashboardPage() {
  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/dashboard")}
      title="통계 / 대시보드"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ADMIN_STAT_SUMMARIES.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} href={item.href} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {ADMIN_DASHBOARD_PLACEHOLDERS.map((item) => (
          <AdminCard key={item.title} className="min-h-[220px]">
            <div className="flex h-full flex-col">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">{item.title}</h2>
              </div>
              <div className="mt-auto pt-6">
                <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm text-stone-400">
                  실제 데이터 연결 예정
                </div>
              </div>
            </div>
          </AdminCard>
        ))}
      </section>
    </AdminShell>
  );
}

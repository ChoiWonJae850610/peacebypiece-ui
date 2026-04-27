import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  ADMIN_DASHBOARD_DISTRIBUTION,
  ADMIN_DASHBOARD_INSIGHT_ITEMS,
  ADMIN_DASHBOARD_PERIODS,
  ADMIN_DASHBOARD_STAGE_FLOW,
  getAdminDashboardMaxStageValue,
  getAdminNavigationItems,
} from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminPage() {
  const maxStageValue = getAdminDashboardMaxStageValue();
  const totalDistributionValue = ADMIN_DASHBOARD_DISTRIBUTION.reduce((sum, item) => sum + item.value, 0);

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin")}
      title="관리자 운영 화면"
    >
      <AdminCard className="flex flex-1 flex-col overflow-hidden lg:min-h-0">
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">OPERATION DASHBOARD</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">운영 통계</h2>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {ADMIN_DASHBOARD_PERIODS.map((period) => (
              <span
                key={period.label}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${period.active ? "bg-stone-950 text-white" : "bg-stone-100 text-stone-500"}`}
              >
                {period.label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid flex-1 gap-6 overflow-hidden py-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="flex min-h-0 flex-col rounded-[28px] border border-stone-100 bg-stone-50/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-stone-950">상태 흐름</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-200">이번달</span>
            </div>

            <div className="mt-8 flex flex-1 items-end gap-4 border-b border-l border-stone-200 px-4 pb-0 pt-6">
              {ADMIN_DASHBOARD_STAGE_FLOW.map((stage) => {
                const height = maxStageValue > 0 ? Math.max(8, Math.round((stage.value / maxStageValue) * 100)) : 8;
                return (
                  <div key={stage.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
                    <div className="flex h-full min-h-44 w-full items-end justify-center">
                      <div className="w-full max-w-16 rounded-t-3xl bg-stone-950/85 shadow-sm" style={{ height: `${height}%` }} aria-label={`${stage.label} ${stage.value}건`} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-stone-950">{stage.value}</p>
                      <p className="mt-1 text-xs font-medium text-stone-500">{stage.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="grid min-h-0 grid-rows-[auto_1fr] gap-4 overflow-hidden">
            <div className="rounded-[28px] border border-stone-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-stone-950">상태 분포</h3>
                <span className="text-xs font-semibold text-stone-400">{totalDistributionValue}건</span>
              </div>
              <div className="mt-5 grid gap-3">
                {ADMIN_DASHBOARD_DISTRIBUTION.map((item) => {
                  const width = totalDistributionValue > 0 ? Math.round((item.value / totalDistributionValue) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                        <span>{item.label}</span>
                        <span>{item.value}건</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-stone-100">
                        <div className="h-2 rounded-full bg-stone-950" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 rounded-[28px] border border-stone-100 bg-stone-950 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">TODAY CHECK</p>
              <div className="mt-4 grid gap-3">
                {ADMIN_DASHBOARD_INSIGHT_ITEMS.map((item) => (
                  <div key={item.label} className="rounded-2xl bg-white/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                    <p className="mt-1 text-xs text-stone-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </AdminCard>
    </AdminShell>
  );
}

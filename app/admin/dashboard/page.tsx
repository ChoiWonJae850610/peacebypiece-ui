import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import {
  getAdminNavigationItems,
  getAdminStatMaxFlowValue,
  getAdminStatTotalPartnerCount,
} from "@/lib/admin/adminDashboard.presentation";
import { getAdminStatsSnapshot } from "@/lib/admin/adminStats.repository";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default async function AdminDashboardPage() {
  const stats = await getAdminStatsSnapshot();
  const maxFlowValue = getAdminStatMaxFlowValue(stats.workorderFlow);
  const totalPartnerCount = getAdminStatTotalPartnerCount(stats.partnerDistribution);

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/dashboard")}
      title="통계정보"
      description="작지 · 거래처 · 파일 사용량"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.summaries.map((item) => (
          <AdminStatCard key={item.label} label={item.label} value={item.value} description={item.description} href={item.href} accent={item.accent} />
        ))}
      </section>

      <section className="grid min-h-0 flex-1 gap-5 overflow-hidden xl:grid-cols-[1.2fr_0.8fr]">
        <AdminCard className="flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">WORKORDER FLOW</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">작지 흐름</h2>
              <p className="mt-1 text-xs text-stone-500">{stats.sourceLabel === "DB" ? "DB 기준 상태별 작업량" : "mock 데이터 기준 상태별 작업량"}</p>
            </div>
            <span className="rounded-full bg-stone-950 px-3 py-1.5 text-xs font-semibold text-white">이번달</span>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 items-end gap-4 rounded-[24px] border border-stone-100 bg-stone-50/70 px-5 pb-5 pt-8">
            {stats.workorderFlow.map((item) => {
              const height = Math.max(8, Math.round((item.value / maxFlowValue) * 100));
              return (
                <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-3">
                  <div className="flex h-52 w-full items-end justify-center border-b border-stone-200">
                    <div className="w-full max-w-14 rounded-t-3xl bg-stone-950 shadow-sm" style={{ height: `${height}%` }} aria-label={`${item.label} ${item.value}건`} />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-stone-950">{item.value}</p>
                    <p className="mt-1 text-xs font-medium text-stone-500">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <div className="grid min-h-0 gap-5 overflow-hidden">
          <AdminCard className="min-h-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">PARTNERS</p>
                <h2 className="mt-2 text-lg font-semibold text-stone-950">거래처 분포</h2>
              </div>
              <span className="text-xs font-semibold text-stone-400">{totalPartnerCount}개</span>
            </div>
            <div className="mt-5 grid gap-3">
              {stats.partnerDistribution.map((item) => {
                const width = totalPartnerCount > 0 ? Math.round((item.value / totalPartnerCount) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                      <span>{item.label}</span>
                      <span>{item.value}개</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-stone-100">
                      <div className="h-2 rounded-full bg-stone-950" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>

          <AdminCard className="min-h-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">FILE USAGE</p>
                <h2 className="mt-2 text-lg font-semibold text-stone-950">파일 사용량</h2>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">{stats.sourceLabel}</span>
            </div>
            <div className="mt-5 grid gap-3">
              {stats.fileUsagePoints.map((item) => {
                const width = item.limit > 0 ? Math.min(100, Math.round((item.value / item.limit) * 100)) : 0;
                return (
                  <div key={item.label} className="rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
                      <span>{item.label}</span>
                      <span>{item.valueLabel}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white">
                      <div className="h-2 rounded-full bg-stone-950" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </AdminCard>
        </div>
      </section>
    </AdminShell>
  );
}

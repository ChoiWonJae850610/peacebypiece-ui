import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminActionTile, AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import { ADMIN_SUMMARY_CARDS, getAdminDashboardPrimarySections, getAdminDashboardStatusPanel, getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminPage() {
  const primarySections = getAdminDashboardPrimarySections();
  const statusPanel = getAdminDashboardStatusPanel();

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin")}
      title="관리자 운영 화면"
      description="작지, 기준정보, 파일 정책을 관리합니다."
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ADMIN_SUMMARY_CARDS.map((card) => (
          <AdminStatCard key={card.label} label={card.label} value={card.value} description={card.description} href={card.href} accent={card.accent} />
        ))}
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {primarySections.map((section) => (
            <AdminCard key={section.title}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-stone-950">{section.title}</h2>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">{section.items.length}개</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {section.items.map((item) => (
                  <AdminActionTile key={item.label} label={item.label} description={item.description} href={item.href} icon={item.icon} statusLabel={item.statusLabel} />
                ))}
              </div>
            </AdminCard>
          ))}
        </div>

        <aside className="grid content-start gap-5">
          <AdminCard>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-stone-950">{statusPanel.title}</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">{statusPanel.items.length}개</span>
            </div>
            <div className="mt-4 grid gap-3">
              {statusPanel.items.map((item) => (
                <AdminActionTile key={item.label} label={item.label} description={item.description} href={item.href} icon={item.icon} statusLabel={item.statusLabel} />
              ))}
            </div>
          </AdminCard>

          <AdminCard className="bg-stone-950 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">OPERATION FOCUS</p>
            <h2 className="mt-3 text-xl font-semibold">오늘 확인 순서</h2>
            <div className="mt-5 grid gap-2 text-sm">
              <p className="rounded-2xl bg-white/10 px-4 py-3">1. 검토 대기 작지</p>
              <p className="rounded-2xl bg-white/10 px-4 py-3">2. 입고 대기 상태</p>
              <p className="rounded-2xl bg-white/10 px-4 py-3">3. 파일 용량 / 휴지통</p>
            </div>
          </AdminCard>
        </aside>
      </section>
    </AdminShell>
  );
}

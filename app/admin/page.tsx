import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminActionTile, AdminCard, AdminStatCard } from "@/components/admin/layout/AdminCard";
import { ADMIN_DASHBOARD_SECTIONS, ADMIN_NAVIGATION_ITEMS, ADMIN_SUMMARY_CARDS } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminPage() {
  const primarySections = ADMIN_DASHBOARD_SECTIONS.slice(0, 4);

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={ADMIN_NAVIGATION_ITEMS}
      title="관리자 운영 화면"
      description="작지 운영, 기준정보, 파일/용량, 통계 현황을 한 화면에서 확인하고 필요한 관리 화면으로 진입합니다."
    >
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ADMIN_SUMMARY_CARDS.map((card) => (
          <AdminStatCard key={card.label} label={card.label} value={card.value} description={card.description} href={card.href} accent={card.accent} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5">
          {primarySections.map((section) => (
            <AdminCard key={section.title}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-stone-950">{section.title}</h2>
                  <p className="mt-1 text-xs text-stone-500">주요 관리 기능으로 바로 이동합니다.</p>
                </div>
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
          <AdminCard className="bg-stone-950 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">QUICK MENU</p>
            <h2 className="mt-3 text-xl font-semibold">오늘 확인할 운영 항목</h2>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="font-semibold">검토 대기 작지</p>
                <p className="mt-1 text-xs leading-5 text-stone-300">검토요청 이후 관리자 확인이 필요한 작지를 먼저 확인합니다.</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="font-semibold">파일 사용량</p>
                <p className="mt-1 text-xs leading-5 text-stone-300">휴지통, purge 후보, 저장소 사용량을 함께 확인합니다.</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="font-semibold">기준정보</p>
                <p className="mt-1 text-xs leading-5 text-stone-300">거래처, 공장, 외주공정, 단위 기준을 운영 전에 정리합니다.</p>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">SETTINGS ROADMAP</p>
            <h2 className="mt-3 text-lg font-semibold text-stone-950">환경설정 분리 예정</h2>
            <div className="mt-4 grid gap-2 text-xs text-stone-500">
              <p className="rounded-2xl bg-stone-50 px-3 py-2">테마 색상 / 화면 밀도</p>
              <p className="rounded-2xl bg-stone-50 px-3 py-2">언어 설정 / 표기 기준</p>
              <p className="rounded-2xl bg-stone-50 px-3 py-2">파일 보관 정책 / 알림 정책</p>
            </div>
          </AdminCard>
        </aside>
      </section>
    </AdminShell>
  );
}

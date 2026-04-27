import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import AdminCompanySettingsForm from "@/components/admin/settings/AdminCompanySettingsForm";
import {
  ADMIN_SETTINGS_GROUPS,
  ADMIN_SETTINGS_SUMMARY_CARDS,
  getAdminNavigationItems,
} from "@/lib/admin/adminDashboard.presentation";
import { buildDefaultCompanySettings } from "@/lib/admin/companySettings.defaults";
import { getCurrentAdminCompany, getCompanySettings } from "@/lib/admin/companySettings.repository";
import type { CompanySettings } from "@/lib/admin/companySettings.types";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

function SettingSummaryCards() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {ADMIN_SETTINGS_SUMMARY_CARDS.map((card) => (
        <AdminCard key={card.label} className="min-h-[132px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">{card.value}</p>
            </div>
            <span className={`rounded-2xl px-3 py-2 text-xs font-semibold ${card.accent}`}>{card.badge}</span>
          </div>
          <p className="mt-4 text-xs leading-5 text-stone-500">{card.description}</p>
        </AdminCard>
      ))}
    </section>
  );
}

function SettingGroups() {
  return (
    <AdminCard>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">SETTING GROUPS</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">설정 그룹</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">관리자 화면에서 반복 사용될 고객사별 설정값을 그룹 단위로 분리합니다.</p>
        </div>
        <span className="w-fit rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-500">DB 저장 연결</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ADMIN_SETTINGS_GROUPS.map((group) => (
          <div key={group.label} className="flex min-h-[120px] items-start gap-4 rounded-3xl border border-stone-200 bg-white p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-lg text-stone-700">{group.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-stone-950">{group.label}</h3>
                <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">{group.statusLabel}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-500">{group.description}</p>
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

async function getInitialSettings(): Promise<{ companyName: string; settings: CompanySettings }> {
  try {
    const company = await getCurrentAdminCompany();
    const settings = await getCompanySettings(company.id);
    return { companyName: company.name, settings };
  } catch {
    return { companyName: WORKSPACE_COMPANY_NAME, settings: buildDefaultCompanySettings(WORKSPACE_COMPANY_ID) };
  }
}

export default async function AdminSettingsPage() {
  const { companyName, settings } = await getInitialSettings();

  return (
    <AdminShell
      companyName={companyName}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/settings")}
      title="환경설정"
      description="고객사별 테마, 언어, 파일 보관 정책, 알림 정책을 저장하고 관리합니다."
    >
      <SettingSummaryCards />
      <SettingGroups />
      <AdminCompanySettingsForm initialSettings={settings} />
    </AdminShell>
  );
}

import AdminShell from "@/components/admin/layout/AdminShell";
import { AdminCard } from "@/components/admin/layout/AdminCard";
import {
  ADMIN_FILE_POLICY_PREVIEW_ITEMS,
  ADMIN_LANGUAGE_OPTIONS,
  ADMIN_NOTIFICATION_POLICY_PREVIEW_ITEMS,
  ADMIN_SETTINGS_GROUPS,
  ADMIN_SETTINGS_STORAGE_PLAN,
  ADMIN_SETTINGS_SUMMARY_CARDS,
  ADMIN_THEME_OPTIONS,
  getAdminNavigationItems,
} from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

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

function PolicyPreviewList({ items }: { items: typeof ADMIN_FILE_POLICY_PREVIEW_ITEMS }) {
  return (
    <div className="mt-5 overflow-hidden rounded-3xl border border-stone-200">
      {items.map((item, index) => (
        <div key={item.label} className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${index > 0 ? "border-t border-stone-200" : ""}`}>
          <div>
            <p className="font-semibold text-stone-900">{item.label}</p>
            <p className="mt-1 text-xs text-stone-500">{item.value}</p>
          </div>
          <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">{item.statusLabel}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/settings")}
      title="환경설정"
      description="고객사별 테마, 언어, 파일 보관 정책, 알림 정책을 한 화면에서 관리할 수 있도록 구조를 분리합니다."
    >
      <SettingSummaryCards />

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <AdminCard>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">SETTING GROUPS</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-950">설정 그룹</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">관리자 화면에서 반복 사용될 고객사별 설정값을 그룹 단위로 분리합니다.</p>
            </div>
            <span className="w-fit rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-500">DB 연결 전 UI 고정 단계</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
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

        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">THEME</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">테마 색상</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">고객사별 화면 accent color로 사용할 후보입니다.</p>
          <div className="mt-5 grid gap-3">
            {ADMIN_THEME_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-3 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3">
                <span className={`h-9 w-9 rounded-2xl shadow-sm ring-1 ring-white ${option.className}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-900">{option.label}</p>
                  <p className="mt-1 text-xs text-stone-500">{option.description}</p>
                </div>
                {option.value === "blue" ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">현재</span> : null}
              </div>
            ))}
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">LANGUAGE</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">언어 설정</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {ADMIN_LANGUAGE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center justify-between rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm">
                <span className="font-semibold text-stone-900">{option.label}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">{option.statusLabel}</span>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">STORAGE PLAN</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">저장 구조 설계</h2>
          <div className="mt-5 space-y-3">
            {ADMIN_SETTINGS_STORAGE_PLAN.map((item) => (
              <div key={item} className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
                {item}
              </div>
            ))}
          </div>
        </AdminCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">FILE POLICY</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">파일 보관 정책</h2>
          <PolicyPreviewList items={ADMIN_FILE_POLICY_PREVIEW_ITEMS} />
        </AdminCard>

        <AdminCard>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">NOTIFICATION POLICY</p>
          <h2 className="mt-2 text-lg font-semibold text-stone-950">알림 정책</h2>
          <PolicyPreviewList items={ADMIN_NOTIFICATION_POLICY_PREVIEW_ITEMS} />
        </AdminCard>
      </section>
    </AdminShell>
  );
}

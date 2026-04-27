import Link from "next/link";
import { ADMIN_DASHBOARD_PLACEHOLDERS, ADMIN_STAT_SUMMARIES } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{WORKSPACE_COMPANY_NAME}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">통계 / 대시보드</h1>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
              <Link
                href="/admin"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                관리자 메인으로 이동
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {ADMIN_STAT_SUMMARIES.map((item) => (
            <article key={item.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-stone-500">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {ADMIN_DASHBOARD_PLACEHOLDERS.map((item) => (
            <article key={item.title} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-500">{item.description}</p>
              <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-xs text-stone-400">
                실제 데이터 연결 예정
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

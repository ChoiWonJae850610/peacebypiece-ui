import Link from "next/link";
import { ADMIN_FILE_MANAGEMENT_ITEMS, ADMIN_FILE_USAGE_CARDS } from "@/lib/admin/adminFiles.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export default function AdminFilesPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{WORKSPACE_COMPANY_NAME}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">파일 / 용량 관리</h1>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
              <Link href="/admin" className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                관리자 메인으로 이동
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {ADMIN_FILE_USAGE_CARDS.map((card) => (
            <article key={card.label} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-stone-500">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{card.value}</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">{card.description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {ADMIN_FILE_MANAGEMENT_ITEMS.map((item) => (
            <article key={item.title} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-900">{item.title}</h2>
                <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">준비중</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-500">{item.description}</p>
              <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-xs text-stone-400">
                {item.status}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

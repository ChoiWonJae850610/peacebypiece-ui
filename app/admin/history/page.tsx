import Link from "next/link";
import AdminWorkOrderHistoryPage from "@/components/admin/history/AdminWorkOrderHistoryPage";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const pageText = i18n.admin.historyPage;

export default function AdminHistoryPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{WORKSPACE_COMPANY_NAME}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{WORKSPACE_COMPANY_NAME} · {pageText.title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-600 md:text-base">{pageText.description}</p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Link
                  href="/admin"
                  aria-label="관리자 메인"
                  title="관리자 메인"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-base font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  ⌂
                </Link>
                <Link
                  href="/worker"
                  className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  {pageText.moveToWorkspace}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <AdminWorkOrderHistoryPage />
      </div>
    </main>
  );
}

import Link from "next/link";
import AdminWorkOrderHistoryButton from "@/components/admin/AdminWorkOrderHistoryButton";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME, WORKSPACE_COMPANY_NAME_EN, getAdminWorkspaceTitle } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const adminSections = i18n.admin.sections;

export default function AdminPage() {
  const eyebrow = WORKSPACE_COMPANY_NAME_EN;
  const title = getAdminWorkspaceTitle(WORKSPACE_COMPANY_NAME);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{eyebrow}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-600 md:text-base">{i18n.admin.description}</p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Link
                  href="/admin/partners"
                  className="inline-flex items-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  거래처/공장 관리
                </Link>
                <AdminWorkOrderHistoryButton />
                <Link
                  href="/worker"
                  className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  {i18n.common.moveToWorkspace}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {adminSections.map((section) => (
            <article key={section.title} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-stone-900">{section.title}</h2>
                <p className="text-sm leading-6 text-stone-600">{section.description}</p>
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                  {i18n.common.comingSoon}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

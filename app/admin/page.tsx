import Link from "next/link";
import AdminWorkspaceTools from "@/components/admin/AdminWorkspaceTools";
import { ADMIN_DASHBOARD_SECTIONS, ADMIN_SUMMARY_CARDS, type AdminDashboardItem } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

function DashboardItem({ item }: { item: AdminDashboardItem }) {
  const className = "group rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:border-stone-300 hover:bg-stone-50";
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">{item.label}</h3>
        <span className="text-xs text-stone-400">{item.href ? "이동" : "준비중"}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-stone-500">{item.description}</p>
    </>
  );

  if (!item.href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{WORKSPACE_COMPANY_NAME}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">관리자 운영 화면</h1>
            </div>
            <div className="flex items-center gap-2 md:justify-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">v{APP_VERSION}</span>
              <AdminWorkspaceTools />
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          {ADMIN_SUMMARY_CARDS.map((card) => {
            const content = (
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:bg-stone-50">
                <p className="text-xs font-medium text-stone-500">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{card.value}</p>
              </div>
            );

            if (!card.href) {
              return <div key={card.label}>{content}</div>;
            }

            return (
              <Link key={card.label} href={card.href}>
                {content}
              </Link>
            );
          })}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {ADMIN_DASHBOARD_SECTIONS.map((section) => (
            <article key={section.title} className="rounded-3xl border border-stone-200 bg-stone-50 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">{section.title}</h2>
              <div className="mt-4 grid gap-3">
                {section.items.map((item) => (
                  <DashboardItem key={item.label} item={item} />
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

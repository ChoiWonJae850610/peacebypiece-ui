import Link from "next/link";
import { SYSTEM_CATEGORY_RULE_SUMMARIES, SYSTEM_COMPANY_SUMMARIES } from "@/lib/constants/company";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";

const i18n = getI18n();
const system = i18n.system;

export default function SystemPage() {
  const overviewCards = [
    system.cards.companies,
    system.cards.invites,
    system.cards.categoryRules,
  ];

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{system.eyebrow}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{system.title}</h1>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{system.versionLabel} v{APP_VERSION}</span>
              <Link
                href="/worker"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                {system.moveToWorkspace}
              </Link>
              <Link
                href="/system/category-rules"
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
              >
                {system.openCategoryRules}
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {overviewCards.map((card) => (
            <article key={card.title} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">{card.badge}</span>
                <h2 className="text-lg font-semibold text-stone-900">{card.title}</h2>
                </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-stone-900">{system.companySection.title}</h2>
            </div>
            <div className="space-y-3">
              {SYSTEM_COMPANY_SUMMARIES.map((company) => (
                <div key={company.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-stone-900">{company.name}</div>
                      <div className="text-sm text-stone-600">{system.companySection.adminLabel}: {company.adminName}</div>
                      <div className="text-sm text-stone-500">{company.seatSummary}</div>
                    </div>
                    <span className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600">{company.statusLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-stone-900">{system.ruleSection.title}</h2>
            </div>
            <div className="space-y-3">
              {SYSTEM_CATEGORY_RULE_SUMMARIES.map((rule) => (
                <div key={rule.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-base font-semibold text-stone-900">{rule.title}</div>
                      <div className="text-sm text-stone-600"><span className="font-medium text-stone-700">{system.ruleSection.keywordsLabel}:</span> {rule.keywordSummary}</div>
                      <div className="text-sm text-stone-600"><span className="font-medium text-stone-700">{system.ruleSection.recommendationLabel}:</span> {rule.recommendation}</div>
                    </div>
                    <span className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600">{rule.statusLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

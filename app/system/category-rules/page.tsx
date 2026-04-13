import Link from "next/link";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import { getCategoryRuleViewItems, testCategoryRuleTitle } from "@/lib/system/categoryRuleView";

const i18n = getI18n();
const system = i18n.system;
const ruleViewItems = getCategoryRuleViewItems();
const selectedRule = ruleViewItems[0] ?? null;
const testExamples = system.categoryRulePage.testExamples;
const testResults = testExamples.map((example) => ({
  title: example,
  result: testCategoryRuleTitle(example),
}));

export default function SystemCategoryRulesPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{system.eyebrow}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">{system.categoryRulePage.title}</h1>
              <p className="max-w-3xl text-sm leading-6 text-stone-600 md:text-base">{system.categoryRulePage.description}</p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{system.versionLabel} v{APP_VERSION}</span>
              <div className="flex flex-wrap gap-2">
                <Link href="/system" className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                  {system.categoryRulePage.backToSystem}
                </Link>
                <Link href="/worker" className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">
                  {system.moveToWorkspace}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.45fr)]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-stone-900">{system.categoryRulePage.listTitle}</h2>
                <p className="text-sm leading-6 text-stone-600">{system.categoryRulePage.listDescription}</p>
              </div>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">{system.categoryRulePage.readOnlyBadge}</span>
            </div>
            <div className="space-y-3">
              {ruleViewItems.map((rule) => {
                const isSelected = rule.id === selectedRule?.id;
                return (
                  <div
                    key={rule.id}
                    className={`rounded-2xl border p-4 transition ${isSelected ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-900"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isSelected ? "bg-white/15 text-white" : "bg-white text-stone-600"}`}>#{rule.order}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${isSelected ? "border-white/15 text-white" : "border-stone-300 text-stone-600"}`}>{rule.statusLabel}</span>
                        </div>
                        <div className="text-base font-semibold">{rule.title}</div>
                        <div className={`text-sm leading-6 ${isSelected ? "text-stone-200" : "text-stone-600"}`}>{rule.recommendationLabel}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rule.keywords.map((keyword) => (
                        <span key={`${rule.id}-${keyword}`} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isSelected ? "bg-white/10 text-white" : "bg-white text-stone-600"}`}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <div className="flex flex-col gap-6">
            <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold text-stone-900">{system.categoryRulePage.detailTitle}</h2>
                <p className="text-sm leading-6 text-stone-600">{system.categoryRulePage.detailDescription}</p>
              </div>
              {selectedRule ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-stone-900">{selectedRule.title}</div>
                    <div className="text-sm leading-6 text-stone-600">{selectedRule.reason}</div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{system.categoryRulePage.detailKeywordsLabel}</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedRule.keywords.map((keyword) => (
                          <span key={`detail-${keyword}`} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">{keyword}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{system.categoryRulePage.detailRecommendationLabel}</div>
                      <div className="text-sm font-semibold text-stone-900">{selectedRule.recommendationLabel}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </article>

            <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold text-stone-900">{system.categoryRulePage.testTitle}</h2>
                <p className="text-sm leading-6 text-stone-600">{system.categoryRulePage.testDescription}</p>
              </div>
              <div className="space-y-3">
                {testResults.map(({ title, result }) => (
                  <div key={title} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-stone-900">{title}</div>
                    {result.matchedRuleId ? (
                      <div className="space-y-2 text-sm text-stone-700">
                        <div><span className="font-medium text-stone-900">{system.categoryRulePage.testMatchedRuleLabel}:</span> {result.matchedRuleTitle}</div>
                        <div><span className="font-medium text-stone-900">{system.categoryRulePage.testMatchedKeywordsLabel}:</span> {result.matchedKeywords.join(", ")}</div>
                        <div><span className="font-medium text-stone-900">{system.categoryRulePage.testRecommendationLabel}:</span> {result.recommendationLabel}</div>
                        <div className="text-stone-600">{result.reason}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-stone-500">{system.categoryRulePage.noMatch}</div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import SystemStoragePurgeButton from "@/components/system/storage/SystemStoragePurgeButton";
import {
  SAMPLE_SYSTEM_CATEGORY_RULE_SUMMARIES,
  SAMPLE_SYSTEM_COMPANY_SUMMARIES,
  SAMPLE_SYSTEM_INVITE_FLOW_STEPS,
  SAMPLE_SYSTEM_INVITE_SUMMARIES,
  SAMPLE_SYSTEM_OPERATION_ITEMS,
} from "@/lib/data/sample/system";
import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import type { SystemInviteAction } from "@/lib/data/domain/system";

const i18n = getI18n();
const system = i18n.system;

function getInviteActionClassName(tone: SystemInviteAction["tone"]) {
  if (tone === "primary") {
    return "border-stone-900 bg-stone-900 text-white hover:bg-stone-800";
  }
  if (tone === "danger") {
    return "border-red-200 bg-red-50 text-red-700 hover:bg-red-100";
  }
  return "border-stone-300 bg-white text-stone-700 hover:bg-stone-50";
}

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
              <p className="max-w-2xl text-sm leading-6 text-stone-600">{system.description}</p>
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
              <SystemStoragePurgeButton />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {overviewCards.map((card) => (
            <article key={card.title} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600">{card.badge}</span>
                <h2 className="text-lg font-semibold text-stone-900">{card.title}</h2>
                <p className="text-sm leading-6 text-stone-600">{card.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-stone-900">{system.operationsSection.title}</h2>
              <p className="text-sm leading-6 text-stone-600">{system.operationsSection.description}</p>
            </div>
            <div className="space-y-3">
              {SAMPLE_SYSTEM_OPERATION_ITEMS.map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="text-base font-semibold text-stone-900">{item.title}</div>
                      <div className="text-sm leading-6 text-stone-600">{item.description}</div>
                    </div>
                    <span className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600">{item.statusLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-stone-900">{system.inviteSection.flowTitle}</h2>
              <p className="text-sm leading-6 text-stone-600">{system.inviteSection.flowDescription}</p>
            </div>
            <div className="space-y-3">
              {SAMPLE_SYSTEM_INVITE_FLOW_STEPS.map((step, index) => (
                <div key={step.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-stone-600 ring-1 ring-stone-200">{index + 1}</span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-base font-semibold text-stone-900">{step.title}</div>
                        <span className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600">{step.statusLabel}</span>
                      </div>
                      <div className="text-sm leading-6 text-stone-600">{step.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-stone-900">{system.inviteSection.title}</h2>
            <p className="text-sm leading-6 text-stone-600">{system.inviteSection.description}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {SAMPLE_SYSTEM_INVITE_SUMMARIES.map((invite) => (
              <article key={invite.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="text-base font-semibold text-stone-900">{invite.companyName}</div>
                      <div className="text-sm text-stone-600">{system.inviteSection.inviteeLabel}: {invite.inviteeName}</div>
                      <div className="truncate text-sm text-stone-500">{system.inviteSection.emailLabel}: {invite.email}</div>
                    </div>
                    <span className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600">{invite.statusLabel}</span>
                  </div>
                  <dl className="space-y-2 text-sm text-stone-600">
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">{system.inviteSection.tokenLabel}</dt>
                      <dd className="font-medium text-stone-700">{invite.tokenPreview}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">{system.inviteSection.linkLabel}</dt>
                      <dd className="font-medium text-stone-700">{invite.inviteUrlLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">{system.inviteSection.requestedByLabel}</dt>
                      <dd className="font-medium text-stone-700">{invite.requestedByLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">{system.inviteSection.acceptedAtLabel}</dt>
                      <dd className="font-medium text-stone-700">{invite.acceptedAtLabel ?? system.inviteSection.pendingAcceptedAt}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">{invite.roleLabel}</dt>
                      <dd className="font-medium text-stone-700">{invite.expiresAtLabel}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {invite.actions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${getInviteActionClassName(action.tone)}`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold text-stone-900">{system.companySection.title}</h2>
              <p className="text-sm leading-6 text-stone-600">{system.companySection.description}</p>
            </div>
            <div className="space-y-3">
              {SAMPLE_SYSTEM_COMPANY_SUMMARIES.map((company) => (
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
              <p className="text-sm leading-6 text-stone-600">{system.ruleSection.description}</p>
            </div>
            <div className="space-y-3">
              {SAMPLE_SYSTEM_CATEGORY_RULE_SUMMARIES.map((rule) => (
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

import Link from "next/link";

import SystemStoragePurgeButton from "@/components/system/storage/SystemStoragePurgeButton";
import { APP_VERSION } from "@/lib/constants/app";
import {
  SAMPLE_SYSTEM_CATEGORY_RULE_SUMMARIES,
  SAMPLE_SYSTEM_COMPANY_SUMMARIES,
} from "@/lib/data/sample/system";
import { getI18n } from "@/lib/i18n";
import {
  SYSTEM_CONSOLE_API_LINKS,
  SYSTEM_CONSOLE_PLACEHOLDERS,
  SYSTEM_CONSOLE_QUICK_LINKS,
  SYSTEM_CONSOLE_TABS,
  type SystemConsoleTabStatus,
} from "@/lib/system/systemConsoleShell";

const i18n = getI18n();
const system = i18n.system;

function getStatusClassName(status: SystemConsoleTabStatus) {
  if (status === "current") {
    return "border-stone-900 bg-stone-900 text-white";
  }

  if (status === "linked") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "api") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "legacy") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

function getTabClassName(isActive: boolean) {
  if (isActive) {
    return "border-stone-900 bg-stone-900 text-white";
  }

  return "border-stone-200 bg-white text-stone-600 hover:bg-stone-50";
}

function renderPlaceholderAction(
  placeholder: (typeof SYSTEM_CONSOLE_PLACEHOLDERS)[number],
) {
  if (placeholder.href) {
    return (
      <Link
        href={placeholder.href}
        className="mt-4 inline-flex rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
      >
        {placeholder.actionLabel}
      </Link>
    );
  }

  if (placeholder.apiPath) {
    return (
      <code className="mt-4 block rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
        {placeholder.apiPath}
      </code>
    );
  }

  return (
    <span className="mt-4 inline-flex rounded-xl border border-stone-200 bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-400">
      {placeholder.actionLabel}
    </span>
  );
}

export default function SystemConsoleShell() {
  const overviewCards = [
    system.cards.companies,
    system.cards.invites,
    system.cards.categoryRules,
  ];

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                {system.eyebrow}
              </p>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-stone-950">
                  {system.title}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600">
                  {system.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-stone-600">
                {system.versionLabel} v{APP_VERSION}
              </span>
              <Link
                href="/"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                {system.moveToWorkspace}
              </Link>
              <Link
                href="/system/category-rules"
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-stone-700 hover:bg-stone-50"
              >
                {system.openCategoryRules}
              </Link>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
            <h2 className="text-lg font-semibold text-stone-950">
              시스템관리자 콘솔
            </h2>
            <p className="text-sm leading-6 text-stone-600">
              고객사 관리, 고객 초대, 요금제·용량, 통계, 시스템 로그 영역을 같은 shell 안에서 확장할 수 있도록 탭과 링크 구조를 고정합니다.
            </p>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {SYSTEM_CONSOLE_TABS.map((tab) => {
              const isActive = tab.id === "overview";

              return (
                <article
                  key={tab.id}
                  className={`rounded-2xl border p-4 ${getTabClassName(isActive)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">{tab.label}</h3>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(
                        tab.status,
                      )}`}
                    >
                      {tab.statusLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 opacity-80">
                    {tab.description}
                  </p>
                  {tab.href ? (
                    <Link
                      href={tab.href}
                      className="mt-4 inline-flex text-xs font-semibold underline underline-offset-4"
                    >
                      화면 열기
                    </Link>
                  ) : tab.apiPath ? (
                    <code className="mt-4 block truncate rounded-xl border border-stone-200 bg-white/70 px-2.5 py-2 text-[11px] text-stone-500">
                      {tab.apiPath}
                    </code>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">화면 바로가기</h2>
            <div className="mt-4 grid gap-3">
              {SYSTEM_CONSOLE_QUICK_LINKS.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4 hover:bg-stone-100"
                >
                  <p className="text-sm font-semibold text-stone-950">
                    {link.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-stone-600">
                    {link.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-stone-500">
                    {link.href}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">API 연결 준비</h2>
            <div className="mt-4 grid gap-3">
              {SYSTEM_CONSOLE_API_LINKS.map((link) => (
                <article
                  key={link.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <p className="text-sm font-semibold text-stone-950">
                    {link.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-stone-600">
                    {link.description}
                  </p>
                  <code className="mt-2 block truncate rounded-xl border border-stone-200 bg-white px-2.5 py-2 text-[11px] text-stone-500">
                    {link.path}
                  </code>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {overviewCards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold text-stone-500">{card.badge}</p>
              <h2 className="mt-3 text-lg font-semibold text-stone-950">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          {SYSTEM_CONSOLE_PLACEHOLDERS.map((placeholder) => (
            <article
              key={placeholder.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold text-stone-500">placeholder</p>
              <h2 className="mt-3 text-base font-semibold text-stone-950">
                {placeholder.title}
              </h2>
              <p className="mt-2 text-xs leading-5 text-stone-600">
                {placeholder.description}
              </p>
              <ul className="mt-4 space-y-2 text-xs text-stone-600">
                {placeholder.items.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
              {renderPlaceholderAction(placeholder)}
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">
              {system.companySection.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {system.companySection.description}
            </p>
            <div className="mt-4 space-y-3">
              {SAMPLE_SYSTEM_COMPANY_SUMMARIES.map((company) => (
                <div
                  key={company.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <p className="text-sm font-semibold text-stone-950">
                    {company.name}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    {system.companySection.adminLabel}: {company.adminName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
                    <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-stone-600">
                      {company.seatSummary}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-stone-600">
                      {company.statusLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-950">
                  {system.ruleSection.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {system.ruleSection.description}
                </p>
              </div>
              <Link
                href="/system/category-rules"
                className="rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
              >
                규칙 관리 열기
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {SAMPLE_SYSTEM_CATEGORY_RULE_SUMMARIES.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <p className="text-sm font-semibold text-stone-950">
                    {rule.title}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    {system.ruleSection.keywordsLabel}: {rule.keywordSummary}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    {system.ruleSection.recommendationLabel}: {rule.recommendation}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-stone-500">
                    {rule.statusLabel}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">스토리지 운영</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            기존 첨부파일 휴지통/삭제 운영 기능은 유지하고, 저장공간 사용량 API는 skeleton 상태로 분리합니다.
          </p>
          <div className="mt-4">
            <SystemStoragePurgeButton />
          </div>
        </section>
      </div>
    </main>
  );
}

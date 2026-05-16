"use client";

import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { useI18n } from "@/lib/i18n";
import {
  MEMBER_WORKSPACE_CARD_SECTIONS,
  getMemberWorkspaceCardsBySection,
  type MemberWorkspaceCardStatus,
} from "@/lib/navigation/memberWorkspaceCards";

function getStatusClassName(status: MemberWorkspaceCardStatus) {
  if (status === "available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-500";
}

export default function MemberWorkspaceHome() {
  const { i18n } = useI18n();
  const copy = i18n.common.workspaceHome;

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#f5f5f4_48%,#eef2ff_100%)] px-4 py-5 text-stone-900 md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[30px] border border-stone-200 bg-white/95 px-5 py-5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white">
                  WAFL
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">
                  {WORKSPACE_COMPANY_NAME}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">
                  v{APP_VERSION}
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-950">
                {copy.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                {copy.description}
              </p>
            </div>
          </div>
        </header>

        {MEMBER_WORKSPACE_CARD_SECTIONS.map((section) => {
          const cards = getMemberWorkspaceCardsBySection(section);
          if (cards.length === 0) return null;

          return (
            <section key={section} className="rounded-[28px] border border-stone-200 bg-white/80 p-4 shadow-sm">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-stone-950">
                  {copy.sections[section].title}
                </h2>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  {copy.sections[section].description}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {cards.map((card) => {
                  const cardCopy = copy.cards[card.id];
                  const statusLabel = copy.statuses[card.status];

                  return (
                    <article
                      key={card.id}
                      className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-stone-950">
                            {cardCopy.label}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-stone-600">
                            {cardCopy.description}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClassName(card.status)}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-4">
                        <Link
                          href={card.href}
                          className="inline-flex rounded-xl border border-stone-900 bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800"
                        >
                          {copy.openLabel}
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

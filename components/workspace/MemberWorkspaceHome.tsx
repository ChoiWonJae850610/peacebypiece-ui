"use client";

import Link from "next/link";

import { showWaflLoadingToast } from "@/components/common/ToastMessage";
import MemberWorkspaceTopbarActions from "@/components/workspace/MemberWorkspaceTopbarActions";
import { APP_VERSION } from "@/lib/constants/app";
import { useI18n } from "@/lib/i18n";
import {
  MEMBER_WORKSPACE_CARD_SECTIONS,
  getMemberWorkspaceCardsBySection,
  type MemberWorkspaceCardStatus,
} from "@/lib/navigation/memberWorkspaceCards";
import type { MemberPermissionCode } from "@/lib/permissions";

function getStatusClassName(status: MemberWorkspaceCardStatus) {
  if (status === "available") {
    return "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]";
  }

  return "border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] text-[var(--pbp-text-muted)]";
}

type MemberWorkspaceHomeProps = {
  companyName?: string | null;
  permissionCodes?: readonly MemberPermissionCode[];
};

export default function MemberWorkspaceHome({
  companyName = null,
  permissionCodes = [],
}: MemberWorkspaceHomeProps) {
  const { i18n } = useI18n();
  const copy = i18n.common.workspaceHome;

  return (
    <main className="min-h-screen bg-[var(--pbp-bg-app)] px-4 py-5 text-[var(--pbp-text-primary)] md:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-[30px] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)]/95 px-5 py-5 shadow-[var(--pbp-shadow-card)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--pbp-brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-inverse)]">
                  WAFL
                </span>
                {companyName ? (
                  <span className="rounded-full bg-[var(--pbp-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-secondary)]">
                    {companyName}
                  </span>
                ) : null}
                <span className="rounded-full bg-[var(--pbp-surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-secondary)]">
                  v{APP_VERSION}
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--pbp-text-primary)]">
                {copy.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pbp-text-secondary)]">
                {copy.description}
              </p>
            </div>
            <MemberWorkspaceTopbarActions showHome={false} />
          </div>
        </header>

        {MEMBER_WORKSPACE_CARD_SECTIONS.map((section) => {
          const cards = getMemberWorkspaceCardsBySection(section, { permissionCodes });
          if (cards.length === 0) return null;

          return (
            <section key={section} className="rounded-[28px] border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)]/85 p-4 shadow-[var(--pbp-shadow-card)]">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-[var(--pbp-text-primary)]">
                  {copy.sections[section].title}
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--pbp-text-secondary)]">
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
                      className="rounded-3xl border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-base)] p-5 shadow-[var(--pbp-shadow-card)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-[var(--pbp-text-primary)]">
                            {cardCopy.label}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-[var(--pbp-text-secondary)]">
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
                        {card.status === "available" ? (
                          <Link
                            href={card.href}
                            className="inline-flex rounded-xl border border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-primary)] px-3 py-2 text-xs font-semibold text-[var(--pbp-text-inverse)] hover:bg-[var(--pbp-brand-primary-hover)]"
                            onClick={() => showWaflLoadingToast(`${cardCopy.label} 화면을 여는 중입니다.`)}
                          >
                            {copy.openLabel}
                          </Link>
                        ) : (
                          <span className="inline-flex rounded-xl border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--pbp-text-muted)]">
                            {copy.plannedLabel}
                          </span>
                        )}
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

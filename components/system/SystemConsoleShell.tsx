import Link from "next/link";

import SystemShell from "@/components/system/layout/SystemShell";
import SystemStatsOverview from "@/components/system/SystemStatsOverview";

import { AdminSection } from "@/components/admin/common/AdminSection";
import {
  SYSTEM_NAV_DEFAULT_CARD_CLASS,
  SYSTEM_NAV_INVERSE_TEXT_CLASS,
  SYSTEM_NAV_MAINTENANCE_CARD_CLASS,
  SYSTEM_NAV_PRIMARY_CARD_CLASS,
  SYSTEM_NAV_WARNING_CARD_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";

import { APP_VERSION } from "@/lib/constants/app";
import { isDevSystemAdminEntryEnabled } from "@/lib/system/devSystemAdmin";
import { getI18n } from "@/lib/i18n";
import {
  SYSTEM_CONSOLE_HERO_OPERATION_CARDS,
  SYSTEM_CONSOLE_NAVIGATION_SECTIONS,
  type SystemConsoleNavigationCard,
  type SystemConsoleNavigationTone,
} from "@/lib/system/systemConsoleShell";

const i18n = getI18n();
const system = i18n.system;

type SystemNavigationToneClassName = {
  card: string;
  badgeTone: AdminStatusBadgeTone;
  description: string;
  href: string;
};


function getNavigationToneClassName(tone: SystemConsoleNavigationTone): SystemNavigationToneClassName {
  if (tone === "primary") {
    return {
      card: SYSTEM_NAV_PRIMARY_CARD_CLASS,
      badgeTone: "inverse",
      description: SYSTEM_NAV_INVERSE_TEXT_CLASS,
      href: SYSTEM_NAV_INVERSE_TEXT_CLASS,
    };
  }

  if (tone === "warning") {
    return {
      card: SYSTEM_NAV_WARNING_CARD_CLASS,
      badgeTone: "warning",
      description: "text-[var(--pbp-status-warning)]",
      href: "text-[var(--pbp-status-warning)]",
    };
  }

  if (tone === "maintenance") {
    return {
      card: SYSTEM_NAV_MAINTENANCE_CARD_CLASS,
      badgeTone: "maintenance",
      description: "text-[var(--pbp-accent)]",
      href: "text-[var(--pbp-accent)]",
    };
  }

  return {
    card: SYSTEM_NAV_DEFAULT_CARD_CLASS,
    badgeTone: "neutral",
    description: "text-[var(--pbp-text-muted)]",
    href: "text-[var(--pbp-text-subtle)]",
  };
}

function SystemNavigationCard({ card }: { card: SystemConsoleNavigationCard }) {
  const tone = getNavigationToneClassName(card.tone);

  return (
    <Link
      href={card.href}
      className={`group rounded-[26px] border p-5 shadow-[var(--pbp-shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--pbp-shadow-elevated)] sm:rounded-[30px] sm:p-6 ${tone.card}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-lg font-semibold tracking-[-0.02em]">{card.label}</h3>
        <AdminStatusBadge tone={tone.badgeTone}>{card.statusLabel}</AdminStatusBadge>
      </div>
      <p className={`mt-4 min-h-[48px] text-sm leading-6 ${tone.description}`}>
        {card.description}
      </p>
      <p className={`mt-5 text-xs font-semibold ${tone.href}`}>{card.href}</p>
    </Link>
  );
}

export default function SystemConsoleShell() {
  const devSystemEntryEnabled = isDevSystemAdminEntryEnabled();

  return (
    <SystemShell contentClassName="mx-auto flex max-w-7xl flex-col gap-5 sm:gap-6">
      <section className="relative overflow-hidden rounded-[38px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] shadow-[var(--pbp-shadow-elevated)]">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[var(--pbp-brand-muted)] opacity-40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-[var(--pbp-surface-selected)] opacity-70 blur-3xl"
        />

        <div className="relative grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:p-7">
          <header className="rounded-[32px] border border-[var(--pbp-brand-muted)] bg-[var(--pbp-brand-primary)] p-6 text-[var(--pbp-text-inverse)] shadow-[var(--pbp-shadow-card)] sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--pbp-text-inverse)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:color-mix(in_srgb,var(--pbp-text-inverse)_70%,transparent)]">
                {system.eyebrow}
              </span>
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--pbp-text-inverse)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-3 py-1 text-[11px] font-semibold text-[color:color-mix(in_srgb,var(--pbp-text-inverse)_80%,transparent)]">
                {system.versionLabel} v{APP_VERSION}
              </span>
              {devSystemEntryEnabled ? (
                <span className="rounded-full border border-[color:color-mix(in_srgb,var(--pbp-text-inverse)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-3 py-1 text-[11px] font-semibold text-[color:color-mix(in_srgb,var(--pbp-text-inverse)_80%,transparent)]">
                  {system.devEntryLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-8 max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                {system.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--pbp-text-inverse)]/72 sm:text-base">
                {system.description}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/system/companies"
                className="rounded-full bg-[var(--pbp-text-inverse)] px-5 py-3 text-sm font-semibold text-[var(--pbp-brand-primary)] shadow-[var(--pbp-shadow-card)] transition hover:-translate-y-0.5"
              >
                고객사 관리 열기
              </Link>
              <Link
                href="/system/audit-logs"
                className="rounded-full border border-[color:color-mix(in_srgb,var(--pbp-text-inverse)_25%,transparent)] bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_10%,transparent)] px-5 py-3 text-sm font-semibold text-[var(--pbp-text-inverse)] opacity-80 transition hover:bg-[color:color-mix(in_srgb,var(--pbp-text-inverse)_15%,transparent)]"
              >
                감사 로그 확인
              </Link>
            </div>
          </header>

          <aside className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {SYSTEM_CONSOLE_HERO_OPERATION_CARDS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-[28px] border border-[var(--pbp-border)] bg-[var(--pbp-surface-soft)] p-5 shadow-[var(--pbp-shadow-card)] transition hover:-translate-y-0.5 hover:bg-[var(--pbp-surface-selected)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pbp-text-subtle)]">
                    {item.label}
                  </p>
                  <span className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--pbp-text-muted)]">
                    {item.statusLabel}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--pbp-text-muted)]">
                  {item.description}
                </p>
              </Link>
            ))}
          </aside>
        </div>
      </section>

      <SystemStatsOverview />

      {SYSTEM_CONSOLE_NAVIGATION_SECTIONS.map((section) => (
        <AdminSection
          key={section.id}
          title={section.title}
          description={section.description}
          className="p-5 sm:p-6"
          bodyClassName="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          headerClassName={SYSTEM_SECTION_HEADER_CLASS}
        >
          {section.cards.map((card) => (
            <SystemNavigationCard key={card.id} card={card} />
          ))}
        </AdminSection>
      ))}
    </SystemShell>
  );
}

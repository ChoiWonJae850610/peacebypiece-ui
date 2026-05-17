import Link from "next/link";

import { AdminCard, AdminSection } from "@/components/admin/common/AdminSection";
import {
  SYSTEM_NAV_DEFAULT_CARD_CLASS,
  SYSTEM_NAV_INVERSE_TEXT_CLASS,
  SYSTEM_NAV_MAINTENANCE_CARD_CLASS,
  SYSTEM_NAV_PRIMARY_CARD_CLASS,
  SYSTEM_NAV_WARNING_CARD_CLASS,
  SYSTEM_PAGE_CLASS,
  SYSTEM_PAGE_WIDE_CLASS,
  SYSTEM_SECTION_HEADER_CLASS,
  SYSTEM_SUBTITLE_CLASS,
  SYSTEM_TITLE_CLASS,
  SYSTEM_EYEBROW_CLASS,
} from "@/components/system/systemSemanticClassNames";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";

import { APP_VERSION } from "@/lib/constants/app";
import { isDevSystemAdminEntryEnabled } from "@/lib/system/devSystemAdmin";
import { getI18n } from "@/lib/i18n";
import {
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
      className={`rounded-[22px] border p-4 shadow-sm transition sm:rounded-3xl sm:p-5 ${tone.card}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h3 className="text-base font-semibold">{card.label}</h3>
        <AdminStatusBadge tone={tone.badgeTone}>{card.statusLabel}</AdminStatusBadge>
      </div>
      <p className={`mt-3 text-sm leading-6 ${tone.description}`}>
        {card.description}
      </p>
      <p className={`mt-4 text-xs font-medium ${tone.href}`}>{card.href}</p>
    </Link>
  );
}

export default function SystemConsoleShell() {
  const devSystemEntryEnabled = isDevSystemAdminEntryEnabled();

  return (
    <main className={SYSTEM_PAGE_CLASS}>
      <div className={SYSTEM_PAGE_WIDE_CLASS}>
        <AdminCard as="header" className="p-4 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className={SYSTEM_EYEBROW_CLASS}>
                {system.eyebrow}
              </p>
              <div className="space-y-2">
                <h1 className={SYSTEM_TITLE_CLASS}>
                  {system.title}
                </h1>
                <p className={SYSTEM_SUBTITLE_CLASS}>
                  {system.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {devSystemEntryEnabled ? (
                <AdminStatusBadge tone="warning">{system.devEntryLabel}</AdminStatusBadge>
              ) : null}
              <AdminStatusBadge tone="neutral">{system.versionLabel} v{APP_VERSION}</AdminStatusBadge>
            </div>
          </div>
        </AdminCard>

        {SYSTEM_CONSOLE_NAVIGATION_SECTIONS.map((section) => (
          <AdminSection
            key={section.id}
            title={section.title}
            description={section.description}
            className="p-4 sm:p-5"
            bodyClassName="mt-4 grid gap-3 sm:grid-cols-2 xl:mt-5 xl:grid-cols-3"
            headerClassName={SYSTEM_SECTION_HEADER_CLASS}
          >
            {section.cards.map((card) => (
              <SystemNavigationCard key={card.id} card={card} />
            ))}
          </AdminSection>
        ))}
      </div>
    </main>
  );
}

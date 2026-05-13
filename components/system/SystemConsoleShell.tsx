import Link from "next/link";

import { AdminCard, AdminSection } from "@/components/admin/common/AdminSection";
import { AdminStatusBadge, type AdminStatusBadgeTone } from "@/components/admin/common/AdminStatusBadge";

import { APP_VERSION } from "@/lib/constants/app";
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
      card: "border-stone-900 bg-stone-950 text-white hover:bg-stone-900",
      badgeTone: "inverse",
      description: "text-stone-200",
      href: "text-stone-200",
    };
  }

  if (tone === "warning") {
    return {
      card: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
      badgeTone: "warning",
      description: "text-amber-800",
      href: "text-amber-700",
    };
  }

  if (tone === "maintenance") {
    return {
      card: "border-blue-100 bg-blue-50 text-blue-950 hover:bg-blue-100",
      badgeTone: "maintenance",
      description: "text-blue-800",
      href: "text-blue-700",
    };
  }

  return {
    card: "border-stone-200 bg-white text-stone-950 hover:bg-stone-50",
    badgeTone: "neutral",
    description: "text-stone-600",
    href: "text-stone-500",
  };
}

function SystemNavigationCard({ card }: { card: SystemConsoleNavigationCard }) {
  const tone = getNavigationToneClassName(card.tone);

  return (
    <Link
      href={card.href}
      className={`rounded-3xl border p-5 shadow-sm transition ${tone.card}`}
    >
      <div className="flex items-start justify-between gap-3">
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
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <AdminCard as="header" className="p-6">
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
              <AdminStatusBadge tone="neutral">{system.versionLabel} v{APP_VERSION}</AdminStatusBadge>
            </div>
          </div>
        </AdminCard>

        {SYSTEM_CONSOLE_NAVIGATION_SECTIONS.map((section) => (
          <AdminSection
            key={section.id}
            title={section.title}
            description={section.description}
            className="p-5"
            bodyClassName="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            headerClassName="border-b border-stone-100 pb-4"
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

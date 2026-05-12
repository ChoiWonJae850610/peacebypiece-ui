import Link from "next/link";

import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";
import {
  SYSTEM_CONSOLE_NAVIGATION_SECTIONS,
  type SystemConsoleNavigationCard,
  type SystemConsoleNavigationTone,
} from "@/lib/system/systemConsoleShell";

const i18n = getI18n();
const system = i18n.system;

function getNavigationToneClassName(tone: SystemConsoleNavigationTone) {
  if (tone === "primary") {
    return {
      card: "border-stone-900 bg-stone-950 text-white hover:bg-stone-900",
      badge: "border-white/20 bg-white/10 text-white",
      description: "text-stone-200",
      href: "text-stone-200",
    };
  }

  if (tone === "warning") {
    return {
      card: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
      badge: "border-amber-200 bg-white text-amber-700",
      description: "text-amber-800",
      href: "text-amber-700",
    };
  }

  if (tone === "maintenance") {
    return {
      card: "border-blue-100 bg-blue-50 text-blue-950 hover:bg-blue-100",
      badge: "border-blue-200 bg-white text-blue-700",
      description: "text-blue-800",
      href: "text-blue-700",
    };
  }

  return {
    card: "border-stone-200 bg-white text-stone-950 hover:bg-stone-50",
    badge: "border-stone-200 bg-stone-50 text-stone-600",
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
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}>
          {card.statusLabel}
        </span>
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
            </div>
          </div>
        </header>

        {SYSTEM_CONSOLE_NAVIGATION_SECTIONS.map((section) => (
          <section
            key={section.id}
            className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-2 border-b border-stone-100 pb-4">
              <h2 className="text-lg font-semibold text-stone-950">
                {section.title}
              </h2>
              <p className="text-sm leading-6 text-stone-600">
                {section.description}
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {section.cards.map((card) => (
                <SystemNavigationCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

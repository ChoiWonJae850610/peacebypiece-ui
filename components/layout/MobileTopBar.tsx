"use client";

import Link from "next/link";

import type { WorkOrderHomeNavigation } from "@/components/workorder/layout/WorkOrderHomeButton";
import { useI18n } from "@/lib/i18n";
import type { DbConnectionStatus } from "@/lib/repositories/dbConnectionStatusStore";
import { getDbConnectionStatusPresentation } from "@/lib/repositories/dbConnectionStatusPresentation";

type Props = {
  companyName: string;
  version: string;
  onOpen: () => void;
  onOpenSettings: () => void;
  dbConnectionStatus?: DbConnectionStatus;
  showRepositoryBadges?: boolean;
  showUserSwitchingTools?: boolean;
  homeNavigation: WorkOrderHomeNavigation;
};

export default function MobileTopBar({ companyName, version, onOpen, onOpenSettings, dbConnectionStatus, showRepositoryBadges = true, showUserSwitchingTools = true, homeNavigation }: Props) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.layout.mobileTopBar;

  const dbStatusPresentation = showRepositoryBadges ? getDbConnectionStatusPresentation(dbConnectionStatus) : null;

  return (
    <div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-3 py-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-stone-900">{companyName}</div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500"><span>{copy.subtitle}</span><span className="text-[10px] leading-none text-stone-400">v{version}</span>{dbStatusPresentation ? <span title={dbStatusPresentation.title ?? undefined} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${dbStatusPresentation.toneClass}`}>{dbStatusPresentation.label}</span> : null}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={homeNavigation.href}
            aria-label={homeNavigation.ariaLabel}
            title={homeNavigation.label}
            className="pbp-touch-target pbp-interactive-button inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            ⌂
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            aria-label="새로고침"
            title="새로고침"
            className="pbp-touch-target pbp-interactive-button inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            ↻
          </button>
          {showUserSwitchingTools ? (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label={copy.openSettingsAria}
              className="pbp-touch-target pbp-interactive-button inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              ⚙️
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpen}
            aria-label={copy.openMenuAria}
            className="pbp-touch-target pbp-interactive-button inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            {copy.menu}
          </button>
        </div>
      </div>
    </div>
  );
}

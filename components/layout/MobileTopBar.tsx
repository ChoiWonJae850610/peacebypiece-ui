"use client";

import Link from "next/link";

import type { WorkOrderHomeNavigation } from "@/components/workorder/layout/WorkOrderHomeButton";
import { useI18n } from "@/lib/i18n";
import type { DbConnectionStatus } from "@/lib/repositories/dbConnectionStatusStore";
import { getDbConnectionStatusPresentation } from "@/lib/repositories/dbConnectionStatusPresentation";


function PersonalSettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.75 20.25a7.25 7.25 0 0 1 14.5 0" />
    </svg>
  );
}

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

export default function MobileTopBar({ companyName, version, onOpen, onOpenSettings, dbConnectionStatus, showRepositoryBadges = false, showUserSwitchingTools = false, homeNavigation }: Props) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.layout.mobileTopBar;

  const dbStatusPresentation = showRepositoryBadges ? getDbConnectionStatusPresentation(dbConnectionStatus) : null;
  const showDevelopmentToolbar = Boolean(dbStatusPresentation || showUserSwitchingTools);

  return (
    <div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 px-3 py-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur md:hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-stone-900">{companyName}</div>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-stone-500"><span>{copy.subtitle}</span><span className="text-[10px] leading-none text-stone-400">v{version}</span></div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={homeNavigation.href}
            aria-label={homeNavigation.ariaLabel}
            title={homeNavigation.label}
            className="pbp-touch-target pbp-interactive-button inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            ⌂
          </Link>
          <Link
            href="/me/settings"
            aria-label={i18n.common.personalSettings.title}
            title={i18n.common.personalSettings.title}
            className="pbp-touch-target pbp-interactive-button inline-flex h-11 w-11 items-center justify-center rounded-xl border border-stone-300 bg-white text-base font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            <PersonalSettingsIcon />
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
      {showDevelopmentToolbar ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-stone-100 pt-2">
          {dbStatusPresentation ? (
            <span
              title={dbStatusPresentation.title ?? undefined}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${dbStatusPresentation.toneClass}`}
            >
              {dbStatusPresentation.label}
            </span>
          ) : null}
          {showUserSwitchingTools ? (
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label={copy.openSettingsAria}
              title={copy.openSettingsAria}
              className="pbp-touch-target pbp-interactive-button inline-flex h-8 items-center justify-center gap-1 rounded-full border border-stone-300 bg-white px-2.5 text-xs font-medium text-stone-700 shadow-sm hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              <span aria-hidden="true">⚙️</span>
              <span>{copy.openSettingsAria}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

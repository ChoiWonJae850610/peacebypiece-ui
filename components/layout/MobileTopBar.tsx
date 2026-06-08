"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminModal } from "@/components/admin/layout/AdminModal";
import { PersonalSettingsPanel } from "@/components/me/PersonalSettingsPage";

import type { WorkOrderHomeNavigation } from "@/components/workorder/layout/WorkOrderHomeButton";
import { useI18n } from "@/lib/i18n";
import type { DbConnectionStatus } from "@/lib/repositories/dbConnectionStatusStore";
import { getDbConnectionStatusPresentation } from "@/lib/repositories/dbConnectionStatusPresentation";

const MOBILE_WORKORDER_TOOLBAR_ICON_BUTTON_CLASS =
  "pbp-touch-target pbp-topbar-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full transition";

function PersonalSettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4.75 20.25a7.25 7.25 0 0 1 14.5 0" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 4.75H6.75A1.75 1.75 0 0 0 5 6.5v11a1.75 1.75 0 0 0 1.75 1.75H9.5" />
      <path d="M14 8.25 17.75 12 14 15.75" />
      <path d="M17.5 12H9.75" />
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
  const [personalSettingsOpen, setPersonalSettingsOpen] = useState(false);
  const copy = i18n.workorder.ui.layout.mobileTopBar;

  const dbStatusPresentation = showRepositoryBadges ? getDbConnectionStatusPresentation(dbConnectionStatus) : null;
  const showDevelopmentToolbar = Boolean(dbStatusPresentation || showUserSwitchingTools);

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--pbp-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_94%,transparent)] px-3 py-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--pbp-text-primary)]">{companyName}</div>
          {showDevelopmentToolbar ? (
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-[var(--pbp-text-muted)]">
              <span>{copy.subtitle}</span>
              <span className="text-[10px] leading-none text-[var(--pbp-text-subtle)]">v{version}</span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={homeNavigation.href}
            aria-label={homeNavigation.ariaLabel}
            title={homeNavigation.label}
            className={MOBILE_WORKORDER_TOOLBAR_ICON_BUTTON_CLASS}
          >
            ⌂
          </Link>
          <button
            type="button"
            onClick={() => setPersonalSettingsOpen(true)}
            aria-label={i18n.common.personalSettings.title}
            title={i18n.common.personalSettings.title}
            className={MOBILE_WORKORDER_TOOLBAR_ICON_BUTTON_CLASS}
          >
            <PersonalSettingsIcon />
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            aria-label="새로고침"
            title="새로고침"
            className={MOBILE_WORKORDER_TOOLBAR_ICON_BUTTON_CLASS}
          >
            ↻
          </button>
          <form action="/api/auth/logout" method="post" className="shrink-0">
            <button
              type="submit"
              aria-label={i18n.common.workorderToolbar.logout}
              title={i18n.common.workorderToolbar.logout}
              className={MOBILE_WORKORDER_TOOLBAR_ICON_BUTTON_CLASS}
            >
              <LogoutIcon />
            </button>
          </form>
          <button
            type="button"
            onClick={onOpen}
            aria-label={copy.openMenuAria}
            className="pbp-touch-target pbp-topbar-icon-button inline-flex h-10 items-center justify-center rounded-full px-3 text-sm font-medium transition"
          >
            {copy.menu}
          </button>
        </div>
      </div>
      {showDevelopmentToolbar ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--pbp-border)] pt-2">
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
              className="pbp-touch-target pbp-interactive-button pbp-topbar-icon-button inline-flex h-8 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-medium shadow-sm"
            >
              <span aria-hidden="true">⚙️</span>
              <span>{copy.openSettingsAria}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <AdminModal
        open={personalSettingsOpen}
        title={i18n.common.personalSettings.title}
        description={i18n.common.personalSettings.description}
        onClose={() => setPersonalSettingsOpen(false)}
        maxWidthClass="md:max-w-2xl"
        bodyClassName="space-y-4 [scrollbar-gutter:stable]"
        minHeightClassName="md:min-h-[420px]"
      >
        <PersonalSettingsPanel />
      </AdminModal>
    </div>
  );
}

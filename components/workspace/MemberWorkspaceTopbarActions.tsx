"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminModal } from "@/components/admin/layout/AdminModal";
import { PersonalSettingsPanel } from "@/components/me/PersonalSettingsPage";
import { useI18n } from "@/lib/i18n";

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.6 12 3.75l8.5 6.85" />
      <path d="M5.75 9.5v9.25a1.5 1.5 0 0 0 1.5 1.5h9.5a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M9.75 20.25v-5.5a1.25 1.25 0 0 1 1.25-1.25h2a1.25 1.25 0 0 1 1.25 1.25v5.5" />
    </svg>
  );
}

function PersonalSettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2.05 2.05 0 0 1-2.9 2.9l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .92V20.5a2.05 2.05 0 0 1-4.1 0v-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.05.05a2.05 2.05 0 0 1-2.9-2.9l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.92-1H3.5a2.05 2.05 0 0 1 0-4.1h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.05-.05a2.05 2.05 0 0 1 2.9-2.9l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.92V3.5a2.05 2.05 0 0 1 4.1 0v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.05-.05a2.05 2.05 0 0 1 2.9 2.9l-.05.05A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .92 1h.18a2.05 2.05 0 0 1 0 4.1h-.08a1.7 1.7 0 0 0-1.02.9Z" />
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

function buildWorkspaceIconButtonClassName(className = "") {
  return `pbp-topbar-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-white hover:text-stone-950 ${className}`.trim();
}

type MemberWorkspaceTopbarActionsProps = {
  showHome?: boolean;
  className?: string;
};

export default function MemberWorkspaceTopbarActions({
  showHome = true,
  className = "",
}: MemberWorkspaceTopbarActionsProps) {
  const { i18n } = useI18n();
  const [personalSettingsOpen, setPersonalSettingsOpen] = useState(false);
  const [reviveKey, setReviveKey] = useState(0);
  const personalSettingsTitle = i18n.common.personalSettings.title;
  const personalSettingsDescription = i18n.common.personalSettings.description;

  useEffect(() => {
    const reviveWorkspaceActions = () => {
      setPersonalSettingsOpen(false);
      setReviveKey((current) => current + 1);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) reviveWorkspaceActions();
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <div key={reviveKey} className={`relative z-30 flex shrink-0 flex-wrap gap-2 ${className}`.trim()}>
      {showHome ? (
        <Link
          href="/workspace"
          aria-label={i18n.common.workspaceHome.title}
          title={i18n.common.workspaceHome.title}
          className={buildWorkspaceIconButtonClassName()}
        >
          <HomeIcon />
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => setPersonalSettingsOpen(true)}
        aria-label={personalSettingsTitle}
        title={personalSettingsTitle}
        className={buildWorkspaceIconButtonClassName()}
      >
        <PersonalSettingsIcon />
      </button>
      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          aria-label={i18n.common.workorderToolbar.logout}
          title={i18n.common.workorderToolbar.logout}
          className={buildWorkspaceIconButtonClassName()}
        >
          <LogoutIcon />
        </button>
      </form>
      <AdminModal
        open={personalSettingsOpen}
        title={personalSettingsTitle}
        description={personalSettingsDescription}
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

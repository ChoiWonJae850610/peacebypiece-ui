"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import AdminThemeScope from "@/components/admin/layout/AdminThemeScope";
import { useI18n } from "@/lib/i18n";

type MemberWorkspaceShellProps = {
  companyName?: string | null;
  appVersion: string;
  title: string;
  description?: string;
  children: ReactNode;
  contentMode?: "scroll" | "fixed-md";
};

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.6 12 3.75l8.5 6.85" />
      <path d="M5.75 9.5v9.25a1.5 1.5 0 0 0 1.5 1.5h9.5a1.5 1.5 0 0 0 1.5-1.5V9.5" />
      <path d="M9.75 20.25v-5.5a1.25 1.25 0 0 1 1.25-1.25h2a1.25 1.25 0 0 1 1.25 1.25v5.5" />
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

export default function MemberWorkspaceShell({
  companyName,
  appVersion,
  title,
  description,
  children,
  contentMode = "scroll",
}: MemberWorkspaceShellProps) {
  const { i18n } = useI18n();
  const isFixedFromDesktop = contentMode === "fixed-md";
  const contentFrameClassName = isFixedFromDesktop
    ? "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0 sm:pr-1 md:overflow-hidden"
    : "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0 sm:pr-1";
  const contentInnerClassName = isFixedFromDesktop
    ? "flex min-h-full flex-col gap-3 pb-2 sm:gap-4 md:h-full md:min-h-0 md:gap-0 md:pb-0"
    : "flex min-h-full flex-col gap-3 pb-2 sm:gap-4 md:gap-5";

  return (
    <AdminThemeScope>
      <main className="fixed inset-0 overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#f5f5f4_45%,#eef2ff_100%)] p-3 text-stone-900 sm:p-4 md:p-6 lg:p-8">
        <div className="mx-auto flex h-full w-full max-w-[1480px] flex-col gap-3 overflow-hidden sm:gap-4 md:gap-5">
          <header className="pbp-topbar-shell relative z-20 rounded-[24px] px-4 py-3 backdrop-blur sm:rounded-[30px] sm:px-5 sm:py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pbp-topbar-chip-primary rounded-full px-3 py-1.5 text-xs font-semibold">WAFL</span>
                  {companyName ? (
                    <span className="pbp-topbar-chip-muted rounded-full px-3 py-1.5 text-xs font-semibold">{companyName}</span>
                  ) : null}
                  <span className="pbp-topbar-chip-muted rounded-full px-3 py-1.5 text-xs font-semibold">v{appVersion}</span>
                </div>
                {description ? (
                  <div className="mt-2 flex sm:mt-3">
                    <span className="pbp-topbar-chip-muted rounded-2xl px-3 py-1.5 text-xs font-semibold leading-5">{description}</span>
                  </div>
                ) : null}
                <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--pbp-text-primary)] sm:text-2xl">{title}</h1>
              </div>

              <div className="relative z-30 flex shrink-0 flex-wrap gap-2">
                <Link
                  href="/workspace"
                  aria-label={i18n.common.workspaceHome.title}
                  title={i18n.common.workspaceHome.title}
                  className="pbp-topbar-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full transition"
                >
                  <HomeIcon />
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    aria-label={i18n.common.workorderToolbar.logout}
                    title={i18n.common.workorderToolbar.logout}
                    className="pbp-topbar-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full transition"
                  >
                    <LogoutIcon />
                  </button>
                </form>
              </div>
            </div>
          </header>
          <div className={contentFrameClassName}>
            <div className={contentInnerClassName}>{children}</div>
          </div>
        </div>
      </main>
    </AdminThemeScope>
  );
}

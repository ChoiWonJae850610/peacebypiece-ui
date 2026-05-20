import type { ReactNode } from "react";

import { SYSTEM_PAGE_CLASS, SYSTEM_PAGE_WIDE_CLASS } from "@/components/system/systemSemanticClassNames";

import { APP_VERSION } from "@/lib/constants/app";
import { getI18n } from "@/lib/i18n";

type SystemShellProps = {
  children: ReactNode;
  contentClassName?: string;
};

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 4.75H6.75A1.75 1.75 0 0 0 5 6.5v11a1.75 1.75 0 0 0 1.75 1.75H9.5" />
      <path d="M14 8.25 17.75 12 14 15.75" />
      <path d="M17.5 12H9.75" />
    </svg>
  );
}

export default function SystemShell({ children, contentClassName = SYSTEM_PAGE_WIDE_CLASS }: SystemShellProps) {
  const systemShell = getI18n().system.shell;

  return (
    <main className={SYSTEM_PAGE_CLASS}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:gap-5">
        <header className="rounded-[24px] border border-[var(--pbp-border)] bg-[color-mix(in_srgb,var(--pbp-surface)_94%,transparent)] px-4 py-3 shadow-[var(--pbp-shadow-card)] backdrop-blur sm:rounded-[30px] sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--pbp-brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-inverse)]">
                  WAFL
                </span>
                <span className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
                  {systemShell.title}
                </span>
                <span className="rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--pbp-text-muted)]">
                  {systemShell.version} {APP_VERSION}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-[var(--pbp-text-muted)] sm:mt-3">
                {systemShell.description}
              </p>
            </div>

            <form action="/api/auth/logout" method="post" className="shrink-0">
              <button
                type="submit"
                aria-label={systemShell.logout}
                title={systemShell.logout}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 text-sm font-semibold text-[var(--pbp-text-primary)] shadow-sm transition hover:border-[var(--pbp-brand-muted)] hover:bg-[var(--pbp-surface-muted)]"
              >
                <LogoutIcon />
                <span>{systemShell.logout}</span>
              </button>
            </form>
          </div>
        </header>

        <div className={contentClassName}>{children}</div>
      </div>
    </main>
  );
}

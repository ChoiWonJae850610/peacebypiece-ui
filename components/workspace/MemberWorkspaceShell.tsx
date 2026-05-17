"use client";

import type { ReactNode } from "react";

import AdminThemeScope from "@/components/admin/layout/AdminThemeScope";
import MemberWorkspaceTopbarActions from "@/components/workspace/MemberWorkspaceTopbarActions";

type MemberWorkspaceShellProps = {
  companyName?: string | null;
  appVersion: string;
  title: string;
  description?: string;
  children: ReactNode;
  contentMode?: "scroll" | "fixed-md";
};

export default function MemberWorkspaceShell({
  companyName,
  appVersion,
  title,
  description,
  children,
  contentMode = "scroll",
}: MemberWorkspaceShellProps) {
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

              <MemberWorkspaceTopbarActions />
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

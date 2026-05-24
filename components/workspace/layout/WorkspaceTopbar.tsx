"use client";

import Link from "next/link";

import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import type { WorkspaceNavigationItem } from "@/lib/navigation/workspaceNavigation";

const NAVIGATION_ICON_LABELS: Record<string, string> = {
  dashboard: "⌂",
  workorder: "□",
  partners: "◇",
  materials: "▧",
  storage: "◫",
  statistics: "↗",
  settings: "⚙",
};

type WorkspaceTopbarProps = {
  companyName: string;
  appVersion: string;
  title: string;
  description?: string;
  navigationItems?: WorkspaceNavigationItem[];
};

export default function WorkspaceTopbar({
  companyName,
  appVersion,
  title,
  description,
  navigationItems = [],
}: WorkspaceTopbarProps) {
  const visibleNavigationItems = navigationItems.filter((item) => Boolean(item.href));

  return (
    <div className="flex flex-col gap-3">
      <AdminTopbar
        companyName={companyName}
        appVersion={appVersion}
        title={title}
        description={description}
      />

      {visibleNavigationItems.length > 0 ? (
        <nav
          aria-label="Workspace menu"
          className="flex gap-2 overflow-x-auto rounded-[24px] border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-2 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {visibleNavigationItems.map((item) => {
            const itemClassName = item.active
              ? "border-[var(--pbp-brand-primary)] bg-[var(--pbp-brand-primary)] text-[var(--pbp-text-inverse)] shadow-sm"
              : "border-[var(--pbp-border)] bg-[var(--pbp-surface-base)] text-[var(--pbp-text-muted)] hover:bg-[var(--pbp-surface-soft)] hover:text-[var(--pbp-text-primary)]";

            return (
              <Link
                key={item.label}
                href={item.href || "/workspace"}
                prefetch={false}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl border px-3.5 text-sm font-semibold transition ${itemClassName}`}
              >
                <span aria-hidden="true" className="text-xs">
                  {NAVIGATION_ICON_LABELS[item.icon] ?? "•"}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

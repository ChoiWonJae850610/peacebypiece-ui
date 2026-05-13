import Link from "next/link";

import type { WorkspaceHomeNavigation } from "@/lib/navigation/workspaceHomeRoutes";

export type WorkOrderHomeNavigation = WorkspaceHomeNavigation;

type WorkOrderHomeButtonProps = {
  homeNavigation: WorkOrderHomeNavigation;
  className?: string;
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

export default function WorkOrderHomeButton({
  homeNavigation,
  className = "",
}: WorkOrderHomeButtonProps) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-2 ${className}`}>
      <Link
        href={homeNavigation.href}
        aria-label={homeNavigation.ariaLabel}
        title={homeNavigation.label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:bg-stone-50"
      >
        <HomeIcon />
      </Link>
    </div>
  );
}

import Link from "next/link";

import type { WorkspaceHomeNavigation } from "@/lib/navigation/workspaceHomeRoutes";

export type WorkOrderHomeNavigation = WorkspaceHomeNavigation;

type WorkOrderHomeButtonProps = {
  homeNavigation: WorkOrderHomeNavigation;
  className?: string;
};

export default function WorkOrderHomeButton({
  homeNavigation,
  className = "",
}: WorkOrderHomeButtonProps) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-2 ${className}`}>
      <Link
        href={homeNavigation.href}
        aria-label={homeNavigation.ariaLabel}
        className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
      >
        ← {homeNavigation.label}
      </Link>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

import AdminSegmentedTabs from "@/components/admin/common/AdminSegmentedTabs";
import { AdminSection } from "@/components/admin/common/AdminSection";
import { ADMIN_STATS_PANEL_CLASS } from "@/components/admin/common/adminSemanticClassNames";

type AdminStatsWorkflowTab = {
  id: string;
  label: string;
  title?: string;
};

type AdminStatsWorkflowSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  tabs: AdminStatsWorkflowTab[];
  activeTabId: string;
  onTabChange: (nextId: string) => void;
  activeContentKey: string;
  isAnimating: boolean;
  direction: number;
  children: ReactNode;
};

export function AdminStatsWorkflowSection({
  eyebrow,
  title,
  description,
  actions,
  tabs,
  activeTabId,
  onTabChange,
  activeContentKey,
  isAnimating,
  direction,
  children,
}: AdminStatsWorkflowSectionProps) {
  const animationClass = isAnimating
    ? direction >= 0
      ? "translate-x-3 opacity-0"
      : "-translate-x-3 opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <AdminSection
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={actions}
      bodyClassName="mt-4"
    >
      <div
        className={`${ADMIN_STATS_PANEL_CLASS} overflow-hidden px-2 py-2 sm:px-2.5 sm:py-2.5`}
      >
        <div className="flex flex-wrap items-center justify-start border-b border-[var(--pbp-border)] pb-1.5 sm:justify-end">
          <AdminSegmentedTabs
            items={tabs}
            activeId={activeTabId}
            onChange={onTabChange}
          />
        </div>

        <div className="mt-2 min-h-[284px] overflow-hidden">
          <div
            key={activeContentKey}
            className={`transform-gpu transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${animationClass}`}
          >
            {children}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}

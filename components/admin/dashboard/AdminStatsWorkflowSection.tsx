"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

import AdminSegmentedTabs from "@/components/admin/common/AdminSegmentedTabs";
import { AdminCard } from "@/components/admin/common/AdminSection";
import { ADMIN_STATS_PANEL_CLASS } from "@/components/admin/common/adminSemanticClassNames";
import { useElementSize } from "@/lib/responsive/useElementSize";

type AdminStatsWorkflowTab = {
  id: string;
  label: string;
  title?: string;
};

const WORKFLOW_HEADER_INLINE_MIN_WIDTH = 640;

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

  const headerRef = useRef<HTMLDivElement | null>(null);
  const { width: headerWidth } = useElementSize(headerRef);
  const isInlineHeader = headerWidth >= WORKFLOW_HEADER_INLINE_MIN_WIDTH;

  return (
    <AdminCard
      className={`${ADMIN_STATS_PANEL_CLASS} overflow-hidden px-3 py-3 sm:px-3.5 sm:py-3.5`}
    >
      <div
        ref={headerRef}
        className={`flex gap-3 border-b border-[var(--pbp-border)] pb-2.5 ${
          isInlineHeader
            ? "flex-row items-start justify-between"
            : "flex-col items-stretch"
        }`}
      >
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] pbp-text-subtle">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold tracking-tight pbp-text-primary">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 pbp-text-muted">
              {description}
            </p>
          ) : null}
        </div>

        <div
          className={`flex shrink-0 flex-col gap-2 ${
            isInlineHeader ? "w-auto items-end" : "w-full items-stretch"
          }`}
        >
          {actions ? (
            <div
              className={`flex flex-wrap items-center gap-2 ${
                isInlineHeader ? "w-auto justify-end" : "w-full"
              }`}
            >
              {actions}
            </div>
          ) : null}
          <div className={isInlineHeader ? "flex justify-end" : "w-full"}>
            <AdminSegmentedTabs
              items={tabs}
              activeId={activeTabId}
              onChange={onTabChange}
            />
          </div>
        </div>
      </div>

      <div className="mt-2 min-h-[284px] overflow-hidden">
        <div
          key={activeContentKey}
          className={`transform-gpu transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${animationClass}`}
        >
          {children}
        </div>
      </div>
    </AdminCard>
  );
}

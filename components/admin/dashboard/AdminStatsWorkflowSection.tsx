"use client";

import type { ReactNode } from "react";
import { useRef } from "react";

import AdminSegmentedTabs from "@/components/admin/common/AdminSegmentedTabs";
import WaflSectionPanel from "@/components/admin/common/WaflSectionPanel";
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
    <WaflSectionPanel
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={
        <div
          ref={headerRef}
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
      }
      bodyClassName="pt-4"
    >
      <div className="min-h-[284px] overflow-hidden">
        <div
          key={activeContentKey}
          className={`transform-gpu transition-[opacity,transform] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${animationClass}`}
        >
          {children}
        </div>
      </div>
    </WaflSectionPanel>
  );
}

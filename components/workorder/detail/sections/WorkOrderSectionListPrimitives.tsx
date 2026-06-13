"use client";

import type { ReactNode } from "react";

import { WaflSurface } from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import { useI18n } from "@/lib/i18n";

export function formatWorkOrderQuantity(value: number, unit: string) {
  return `${Math.max(0, Number(value) || 0).toLocaleString()}${unit}`;
}

export function formatWorkOrderMoney(value: number) {
  return `${Math.max(0, Number(value) || 0).toLocaleString()}원`;
}

type WorkOrderSectionListCardProps = {
  component: string;
  title: string;
  eyebrow?: string;
  badge?: ReactNode;
  details?: readonly string[];
  locked: boolean;
  onEdit: () => void;
  onRemove?: () => void;
  editLabel?: string;
  deleteLabel?: string;
};

export function WorkOrderSectionListCard({
  component,
  title,
  eyebrow,
  badge,
  details = [],
  locked,
  onEdit,
  onRemove,
  editLabel,
  deleteLabel,
}: WorkOrderSectionListCardProps) {
  const { i18n } = useI18n();
  const common = i18n.workorder.ui.common;
  const resolvedEditLabel = editLabel ?? common.editSuffix;
  const resolvedDeleteLabel = deleteLabel ?? common.deleteSuffix;

  return (
    <WaflSurface
      component={component}
      shape="control"
      tone="muted"
      className="p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {badge ? (
            <div className="mb-2 flex min-w-0 items-center gap-2">{badge}</div>
          ) : null}
          {eyebrow ? (
            <div className="text-[11px] font-semibold pbp-text-subtle">
              {eyebrow}
            </div>
          ) : null}
          <div
            className={
              eyebrow || badge
                ? "mt-1 truncate text-sm font-semibold pbp-text-primary"
                : "truncate text-sm font-semibold pbp-text-primary"
            }
          >
            {title}
          </div>
          {details.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs pbp-text-muted">
              {details.filter(Boolean).map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </div>
          ) : null}
        </div>
        {!locked ? (
          <WorkOrderCardActionMenu
            menuLabel={`${title} ${common.actionMenuSuffix}`}
            editLabel={`${title} ${resolvedEditLabel}`}
            editText={resolvedEditLabel}
            onEdit={onEdit}
            deleteLabel={
              onRemove ? `${title} ${resolvedDeleteLabel}` : undefined
            }
            deleteText={onRemove ? resolvedDeleteLabel : undefined}
            onDelete={onRemove}
          />
        ) : null}
      </div>
    </WaflSurface>
  );
}

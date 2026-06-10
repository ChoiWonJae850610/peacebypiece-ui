"use client";

import { useEffect, useRef, useState } from "react";
import { REORDERABLE_WORKFLOW_STATES, isWorkflowStateOneOf } from "@/lib/constants/workorderStates";
import { canReorderWorkOrder } from "@/lib/workorder/reorder/helpers";
import { AppBadge, WaflSurface } from "@/components/common/ui";
import { WorkOrderMoreIconButton } from "@/components/workorder/common/WorkOrderIconButtons";
import { useI18n } from "@/lib/i18n";
import { translateWorkflowStateLabel } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { getCategoryPath, getWorkOrderDisplayTitle, getWorkOrderState } from "@/lib/workorder/presentation/workOrderPresentation";
import { getWorkOrderStatusBadgeSemanticClass } from "@/lib/workorder/presentation/workOrderListSemanticPresentation";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";

type Props = {
  workOrder: WorkOrderListItem;
  selectedId: string;
  workflowStateById: Record<string, string>;
  onClick: (id: string) => void;
  onReorder?: (id: string) => void;
  onRework?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: (workflowState: WorkflowState) => boolean;
  canReorder?: boolean;
  writeLocked?: boolean;
  writeLockMessage?: string;
};

export default function WorkOrderListCard({
  workOrder,
  selectedId,
  workflowStateById,
  onClick,
  onReorder,
  onDelete,
  canDelete,
  canReorder = false,
  writeLocked = false,
  writeLockMessage,
}: Props) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.layout.workOrderListCard;
  const state = getWorkOrderState(workflowStateById, workOrder.id);
  const stateLabel = translateWorkflowStateLabel(state, i18n);
  const categoryPath = getCategoryPath(workOrder) || copy.uncategorized;
  const active = workOrder.id === selectedId;
  const canShowReorder = canReorder && canReorderWorkOrder(workOrder) && isWorkflowStateOneOf(state, REORDERABLE_WORKFLOW_STATES);
  const canShowDelete = Boolean(onDelete) && (!canDelete || canDelete(state));
  const hasMenuActions = canShowReorder || canShowDelete;
  const canOpenMenu = hasMenuActions && !writeLocked;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (writeLocked && menuOpen) {
      setMenuOpen(false);
    }
  }, [menuOpen, writeLocked]);

  useEffect(() => {
    if (!menuOpen || writeLocked) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, writeLocked]);

  return (
    <WaflSurface
      component="list-card"
      shape="control"
      tone={active ? "selected" : "muted"}
      data-wafl-state={active ? "selected" : "normal"}
      className={`group pbp-interactive-card w-full px-3 py-3 transition-all duration-150 ${active ? "pbp-workorder-list-card-selected" : "pbp-workorder-list-card"}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <button type="button" onClick={() => onClick(workOrder.id)} className="pbp-touch-target pbp-press-subtle min-w-0 flex-1 text-left">
          <div className="min-w-0 truncate text-[15px] font-semibold leading-5">{getWorkOrderDisplayTitle(workOrder)}</div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <AppBadge
              tone="neutral"
              size="sm"
              className={`pbp-workorder-status-badge h-6 gap-2 transition-colors duration-150 ease-out ${active ? "pbp-workorder-status-active" : getWorkOrderStatusBadgeSemanticClass(state)}`}
            >
              <span className="pbp-workorder-status-dot h-2 w-2 rounded-full" aria-hidden="true" />
              {stateLabel}
            </AppBadge>
          </div>
          <div className="pbp-workorder-list-muted mt-2 min-w-0 space-y-0.5 text-[11px] leading-4">
            <div className="truncate" title={categoryPath}>{categoryPath}</div>
            {workOrder.vendor ? <div className="truncate">{copy.vendorLabel}: {workOrder.vendor}</div> : null}
            {workOrder.dueDate ? <div>{copy.dueDateLabel}: {workOrder.dueDate}</div> : null}
          </div>
        </button>
        <div className="relative shrink-0" ref={menuRef}>
          <WorkOrderMoreIconButton
            label={copy.moreActionsAria}
            onClick={() => { if (canOpenMenu) setMenuOpen((prev) => !prev); }}
            disabled={!canOpenMenu}
            title={writeLocked ? writeLockMessage ?? i18n.workorder.lifecycle.genericProcessingLabel : undefined}
            active={active}
            size="md"
            className=""
            aria-haspopup="menu"
            aria-expanded={canOpenMenu && menuOpen}
          />
          {menuOpen && canOpenMenu ? (
            <div
              className={`absolute right-0 top-10 z-20 min-w-[132px] wafl-shape-control border p-1 ${
                active ? "border-[var(--pbp-text-primary)] bg-[var(--pbp-text-primary)] text-[var(--pbp-surface)]" : "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]"
              }`}
            >
              {canShowReorder ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReorder?.(workOrder.id);
                  }}
                  className={`flex w-full items-center wafl-shape-control px-3 py-2 text-left text-sm ${
                    active ? "hover:bg-white/10" : "hover:bg-[var(--pbp-surface-muted)]"
                  }`}
                >
                  {copy.reorder}
                </button>
              ) : null}
              {canShowDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(workOrder.id);
                  }}
                  className={`flex w-full items-center wafl-shape-control px-3 py-2 text-left text-sm ${
                    active ? "text-[var(--pbp-status-danger-bg)] hover:bg-white/10" : "text-[var(--pbp-status-danger-fg)] hover:bg-[var(--pbp-status-danger-bg)]"
                  }`}
                >
                  {copy.delete}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </WaflSurface>
  );
}

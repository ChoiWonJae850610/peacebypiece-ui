"use client";

import { REORDERABLE_WORKFLOW_STATES } from "@/lib/constants/workorderStates";
import { useI18n } from "@/lib/i18n";
import { getStageDotTone, getWorkflowStateLabel } from "@/lib/workorder/presentation/statusPresentation";
import { getCategoryPath, getWorkOrderCardTone, getWorkOrderState } from "@/lib/workorder/presentation/workOrderPresentation";
import type { WorkOrderListItem, WorkflowState } from "@/types/workorder";

type Props = {
  workOrder: WorkOrderListItem;
  selectedId: string;
  workflowStateById: Record<string, string>;
  onClick: (id: string) => void;
  onReorder?: (id: string) => void;
  onDelete?: (id: string) => void;
  canDelete?: (workflowState: WorkflowState) => boolean;
  canReorder?: boolean;
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
}: Props) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.layout.workOrderListCard;
  const state = getWorkOrderState(workflowStateById, workOrder.id);
  const stateLabel = getWorkflowStateLabel(state);
  const active = workOrder.id === selectedId;
  const canShowReorder = canReorder && (REORDERABLE_WORKFLOW_STATES as readonly WorkflowState[]).includes(state);
  const canShowDelete = canDelete?.(state) ?? false;

  return (
    <div
      className={`group pbp-interactive-card w-full rounded-2xl border p-3 ${
        active
          ? "border-stone-900 bg-stone-900 text-white shadow-[0_10px_28px_rgba(28,25,23,0.18)] ring-1 ring-stone-900/10"
          : "border-stone-200 bg-stone-50 text-stone-900 hover:border-stone-300 hover:bg-white hover:shadow-[0_10px_24px_rgba(28,25,23,0.08)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => onClick(workOrder.id)} className="pbp-touch-target pbp-press-subtle min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-semibold leading-5">{workOrder.title}</div>
          <div className="mt-2 flex h-7 items-center">
            <span
              className={`inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-[11px] font-semibold transition-colors duration-150 ease-out ${
                active ? "bg-white/15 text-white ring-1 ring-white/10" : `${getWorkOrderCardTone(state)} ring-1 ring-black/5 group-hover:ring-black/10`
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : getStageDotTone(state)}`} aria-hidden="true" />
              {stateLabel}
            </span>
          </div>
          <div className={`mt-2 space-y-0.5 text-xs leading-4 ${active ? "text-stone-200" : "text-stone-500"}`}>
            <div className="truncate">{getCategoryPath(workOrder) || copy.uncategorized}</div>
            <div className="truncate">{copy.vendorLabel}: {workOrder.vendor ?? copy.unspecified}</div>
            <div>{copy.dueDateLabel}: {workOrder.dueDate ?? copy.unspecified}</div>
            <div>{copy.attachmentsLabel}: {workOrder.filesCount ?? 0}{copy.countSuffix}</div>
          </div>
        </button>
        <div className="flex shrink-0 items-start gap-1.5">
          {canShowReorder ? (
            <button
              type="button"
              onClick={() => onReorder?.(workOrder.id)}
              className={`pbp-touch-target pbp-interactive-button h-9 rounded-xl border px-3 text-xs font-medium ${
                active
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                  : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-100"
              }`}
            >
              {copy.reorder}
            </button>
          ) : null}
          {canShowDelete ? (
            <button
              type="button"
              onClick={() => onDelete?.(workOrder.id)}
              className={`pbp-touch-target pbp-interactive-button h-9 rounded-xl border px-3 text-xs font-medium ${
                active
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                  : "border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50"
              }`}
            >
              {copy.delete}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

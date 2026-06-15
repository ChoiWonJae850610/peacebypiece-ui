"use client";

import { REORDERABLE_WORKFLOW_STATES, isWorkflowStateOneOf } from "@/lib/constants/workorderStates";
import { canReorderWorkOrder } from "@/lib/workorder/reorder/helpers";
import { AppBadge, WaflCardButton, WaflSelectableCard } from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
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
  return (
    <WaflSelectableCard
      selected={active}
      className={`group relative px-3 py-3 ${active ? "pbp-workorder-list-card-selected" : "pbp-workorder-list-card"}`}
    >
      <div className="min-w-0 pr-11">
        <WaflCardButton onClick={() => onClick(workOrder.id)}>
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
        </WaflCardButton>
        {canOpenMenu ? (
          <div className="absolute right-3 top-3">
          <WorkOrderCardActionMenu
            menuLabel={copy.moreActionsAria}
            editLabel={canShowReorder ? copy.reorder : undefined}
            editText={canShowReorder ? copy.reorder : undefined}
            onEdit={canShowReorder ? () => onReorder?.(workOrder.id) : undefined}
            deleteLabel={canShowDelete ? copy.delete : undefined}
            deleteText={canShowDelete ? copy.delete : undefined}
            onDelete={canShowDelete ? () => onDelete?.(workOrder.id) : undefined}
          />
          </div>
        ) : (
          <div className="absolute right-3 top-3 h-10 w-10" title={writeLocked ? writeLockMessage ?? i18n.workorder.lifecycle.genericProcessingLabel : undefined} />
        )}
      </div>
    </WaflSelectableCard>
  );
}

import { useMemo, useState } from "react";

import { AdminButton } from "@/components/admin/common/AdminButton";
import { AdminCard } from "@/components/admin/common/AdminSection";
import SectionCountBadge from "@/components/common/ui/SectionCountBadge";
import MaterialOrderPanelMessage from "@/features/material-orders/components/MaterialOrderPanelMessage";
import {
  MATERIAL_ORDER_LIST_CARD_BASE_CLASS,
  MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS,
  MATERIAL_ORDER_NESTED_ROW_CLASS,
  MATERIAL_ORDER_PANEL_CARD_CLASS,
  MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
  MATERIAL_ORDER_PANEL_HEADER_CLASS,
  MATERIAL_ORDER_PANEL_LIST_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import {
  type MaterialOrderDraftLine,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import {
  filterMaterialOrderCandidates,
  calculateMaterialRequestCompletedQuantity,
  calculateMaterialRequestCompletionRemainingQuantity,
  calculateMaterialRequestCurrentDraftQuantity,
  calculateMaterialRequestOrderedQuantity,
  calculateMaterialRequestRemainingQuantity,
  formatMaterialItemTypeLabel,
  formatMaterialQuantity,
  formatMaterialRequestReadableStatus,
  formatWorkOrderMaterialCompletionLabel,
  isMaterialRequestAlreadyAdded,
  summarizeWorkOrderMaterialCompletion,
  type MaterialRequestQuantityMap,
} from "@/features/material-orders/materialOrderPanelUtils";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";

type MaterialOrderAllocationPanelProps = {
  candidates: MaterialOrderWorkspaceWorkOrderCandidate[];
  lines: MaterialOrderDraftLine[];
  materialRequestQuantityMap: MaterialRequestQuantityMap;
  materialRequestCompletionMap: MaterialRequestQuantityMap;
  editable: boolean;
  loading: boolean;
  errorMessage: string | null;
  onAddMaterialToOrder: (
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => void;
  onRetry: () => void;
};

export default function MaterialOrderAllocationPanel({
  candidates,
  lines,
  materialRequestQuantityMap,
  materialRequestCompletionMap,
  editable,
  loading,
  errorMessage,
  onAddMaterialToOrder,
  onRetry,
}: MaterialOrderAllocationPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCandidates = useMemo(() => (
    filterMaterialOrderCandidates({
      candidates,
      searchQuery,
    })
  ), [candidates, searchQuery]);

  return (
    <AdminCard className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      <div className={MATERIAL_ORDER_PANEL_HEADER_CLASS}>
        <div className="flex items-end justify-between gap-2">
          <h2 className="min-w-0 text-base font-semibold tracking-tight pbp-text-primary">작업지시서</h2>
          <SectionCountBadge className="translate-y-0.5">{filteredCandidates.length}건</SectionCountBadge>
        </div>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="제품·자재 검색"
          className={fieldClassName("mt-3 min-h-9 text-xs")}
        />
      </div>

      <div className={MATERIAL_ORDER_PANEL_LIST_CLASS}>
        {loading ? (
          <MaterialOrderPanelMessage title="불러오는 중" description="작업지시서 목록을 조회하고 있습니다." />
        ) : errorMessage ? (
          <MaterialOrderPanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} />
        ) : candidates.length === 0 ? (
          <MaterialOrderPanelMessage
            title="표시할 작업지시서 없음"
            description="자재 발주 대기 상태의 작업지시서가 없습니다."
          />
        ) : filteredCandidates.length === 0 ? (
          <MaterialOrderPanelMessage title="검색 결과 없음" description="검색어를 조정해보세요." />
        ) : (
          filteredCandidates.map((workOrder) => (
            <AllocationCandidateCard
              key={workOrder.id}
              workOrder={workOrder}
              lines={lines}
              materialRequestQuantityMap={materialRequestQuantityMap}
              materialRequestCompletionMap={materialRequestCompletionMap}
              editable={editable}
              onAddMaterialToOrder={onAddMaterialToOrder}
            />
          ))
        )}
      </div>
    </AdminCard>
  );
}

function AllocationCandidateCard({
  workOrder,
  lines,
  materialRequestQuantityMap,
  materialRequestCompletionMap,
  editable,
  onAddMaterialToOrder,
}: {
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
  lines: MaterialOrderDraftLine[];
  materialRequestQuantityMap: MaterialRequestQuantityMap;
  materialRequestCompletionMap: MaterialRequestQuantityMap;
  editable: boolean;
  onAddMaterialToOrder: (
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => void;
}) {
  const completionSummary = summarizeWorkOrderMaterialCompletion({
    workOrder,
    materialRequestQuantityMap,
    materialRequestCompletionMap,
  });

  return (
    <div className={`${MATERIAL_ORDER_LIST_CARD_BASE_CLASS} ${MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold pbp-text-primary">{workOrder.productName || workOrder.code}</p>
          <p className="mt-1 text-[11px] pbp-text-subtle">{workOrder.managerLabel} · {workOrder.dueDateLabel}</p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
            completionSummary.isComplete
              ? "border-[var(--pbp-status-success-bg)] bg-[var(--pbp-status-success-bg)] text-[var(--pbp-status-success-fg)]"
              : completionSummary.isInProgressCovered
                ? "border-[var(--pbp-status-info-bg)] bg-[var(--pbp-status-info-bg)] text-[var(--pbp-status-info-fg)]"
                : "pbp-border pbp-surface-muted pbp-text-muted",
          ].join(" ")}
        >
          {formatWorkOrderMaterialCompletionLabel(completionSummary)}
        </span>
      </div>

      <div className="mt-3 grid gap-1.5">
        {workOrder.materialItems.map((material) => (
          <WorkOrderMaterialRequestRow
            key={material.key}
            workOrder={workOrder}
            material={material}
            lines={lines}
            materialRequestQuantityMap={materialRequestQuantityMap}
            materialRequestCompletionMap={materialRequestCompletionMap}
            editable={editable}
            onAddMaterialToOrder={onAddMaterialToOrder}
          />
        ))}
      </div>
    </div>
  );
}

function WorkOrderMaterialRequestRow({
  workOrder,
  material,
  lines,
  materialRequestQuantityMap,
  materialRequestCompletionMap,
  editable,
  onAddMaterialToOrder,
}: {
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
  material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number];
  lines: MaterialOrderDraftLine[];
  materialRequestQuantityMap: MaterialRequestQuantityMap;
  materialRequestCompletionMap: MaterialRequestQuantityMap;
  editable: boolean;
  onAddMaterialToOrder: (
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => void;
}) {
  const isAdded = isMaterialRequestAlreadyAdded({
    lines,
    workOrderId: workOrder.id,
    materialKey: material.key,
  });
  const orderedQuantity = calculateMaterialRequestOrderedQuantity(
    materialRequestQuantityMap,
    workOrder.id,
    material.key,
  );
  const currentDraftQuantity = calculateMaterialRequestCurrentDraftQuantity(
    materialRequestQuantityMap,
    workOrder.id,
    material.key,
  );
  const remainingQuantity = calculateMaterialRequestRemainingQuantity({
    quantityMap: materialRequestQuantityMap,
    workOrderId: workOrder.id,
    materialKey: material.key,
    requiredQuantity: material.quantity,
  });
  const completedQuantity = calculateMaterialRequestCompletedQuantity(
    materialRequestCompletionMap,
    workOrder.id,
    material.key,
  );
  const completionRemainingQuantity = calculateMaterialRequestCompletionRemainingQuantity({
    quantityMap: materialRequestCompletionMap,
    workOrderId: workOrder.id,
    materialKey: material.key,
    requiredQuantity: material.quantity,
  });
  const isCompletionFulfilled = completionRemainingQuantity <= 0;
  const isAllocationCovered = remainingQuantity <= 0;
  const readableStatus = formatMaterialRequestReadableStatus({
    requiredQuantity: material.quantity,
    orderedQuantity,
    currentDraftQuantity,
    remainingQuantity,
    completedQuantity,
    completionRemainingQuantity,
    unit: material.unit,
  });

  return (
    <div className={MATERIAL_ORDER_NESTED_ROW_CLASS}>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold pbp-text-primary">{material.itemName}</p>
        <p className="mt-0.5 text-[11px] pbp-text-muted">
          {formatMaterialItemTypeLabel(material.itemType)} · 필요 {formatMaterialQuantity(material.quantity, material.unit)}
        </p>
        <p className="mt-0.5 text-[11px] pbp-text-subtle">
          {readableStatus}
        </p>
      </div>
      <AdminButton
        size="sm"
        className="min-h-7 px-3 py-1 text-xs"
        variant={isAdded || isAllocationCovered ? "ghost" : "secondary"}
        disabled={!editable || isAdded || isAllocationCovered}
        onClick={() => onAddMaterialToOrder(workOrder, material)}
      >
        {isAdded ? "선택됨" : isCompletionFulfilled ? "완료" : isAllocationCovered ? "진행중" : "선택"}
      </AdminButton>
    </div>
  );
}

function fieldClassName(extra = "") {
  return [
    MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
    extra,
  ].filter(Boolean).join(" ");
}

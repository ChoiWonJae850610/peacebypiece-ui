import { useMemo, useState } from "react";

import { AppBadge, AppButton, AppCard } from "@/components/common/ui";
import { SectionCountBadge } from "@/components/common/ui";
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
  mobile?: boolean;
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
  mobile = false,
}: MaterialOrderAllocationPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCandidates = useMemo(() => (
    filterMaterialOrderCandidates({
      candidates,
      searchQuery,
    })
  ), [candidates, searchQuery]);

  return (
    <AppCard padding="none" className={MATERIAL_ORDER_PANEL_CARD_CLASS}>
      <div className={MATERIAL_ORDER_PANEL_HEADER_CLASS}>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="min-w-0 text-base font-semibold tracking-tight pbp-text-primary">작업지시서 자재 선택</h2>
          </div>
          <SectionCountBadge className="translate-y-0.5">{filteredCandidates.length}건</SectionCountBadge>
        </div>
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="제품·자재·담당자 검색"
          className={fieldClassName("mt-3 min-h-9 text-xs")}
        />
      </div>

      <div className={MATERIAL_ORDER_PANEL_LIST_CLASS}>
        {loading ? (
          <MaterialOrderPanelMessage title="불러오는 중" description="자재 발주 대기 작업지시서를 조회하고 있습니다." kind="loading" />
        ) : errorMessage ? (
          <MaterialOrderPanelMessage title="조회 실패" description={errorMessage} actionLabel="다시 조회" onAction={onRetry} kind="error" />
        ) : candidates.length === 0 ? (
          <MaterialOrderPanelMessage
            title="선택 가능한 자재 없음"
            description="자재 발주 대기 상태의 작업지시서가 없습니다."
          />
        ) : filteredCandidates.length === 0 ? (
          <MaterialOrderPanelMessage title="검색 결과 없음" description="제품명, 자재명, 담당자 검색어를 조정하세요." kind="search" />
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
              mobile={mobile}
            />
          ))
        )}
      </div>
    </AppCard>
  );
}


function countMaterialItemsByType(
  items: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"],
) {
  return items.reduce(
    (acc, item) => {
      if (item.itemType === "submaterial") {
        acc.subsidiary += 1;
      } else {
        acc.fabric += 1;
      }
      return acc;
    },
    { fabric: 0, subsidiary: 0 },
  );
}

function countRemainingMaterialItems({
  workOrder,
  materialRequestCompletionMap,
}: {
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
  materialRequestCompletionMap: MaterialRequestQuantityMap;
}) {
  return workOrder.materialItems.reduce((count, material) => {
    const completionRemainingQuantity = calculateMaterialRequestCompletionRemainingQuantity({
      quantityMap: materialRequestCompletionMap,
      workOrderId: workOrder.id,
      materialKey: material.key,
      requiredQuantity: material.quantity,
    });
    return completionRemainingQuantity > 0 ? count + 1 : count;
  }, 0);
}

function AllocationCandidateCard({
  workOrder,
  lines,
  materialRequestQuantityMap,
  materialRequestCompletionMap,
  editable,
  onAddMaterialToOrder,
  mobile = false,
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
  mobile?: boolean;
}) {
  const completionSummary = summarizeWorkOrderMaterialCompletion({
    workOrder,
    materialRequestQuantityMap,
    materialRequestCompletionMap,
  });
  const itemTypeSummary = countMaterialItemsByType(workOrder.materialItems);
  const remainingItemCount = countRemainingMaterialItems({
    workOrder,
    materialRequestCompletionMap,
  });
  const materialSummaryLabel = `원단 ${itemTypeSummary.fabric}종 · 부자재 ${itemTypeSummary.subsidiary}종`;
  const remainingSummaryLabel = completionSummary.isComplete
    ? "자재 발주 완료"
    : `남은 자재 ${remainingItemCount}개`;
  const materialItemsCount = workOrder.materialItems.length;

  return (
    <AppCard padding="sm" className={`${MATERIAL_ORDER_LIST_CARD_BASE_CLASS} ${MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold pbp-text-primary">{workOrder.productName || workOrder.code}</p>
          <p className="mt-1 text-[11px] pbp-text-subtle">{workOrder.managerLabel} · {workOrder.dueDateLabel}</p>
        </div>
        <AppBadge
          tone={completionSummary.isComplete ? "success" : completionSummary.isInProgressCovered ? "info" : "neutral"}
          size="sm"
          className="shrink-0"
        >
          {formatWorkOrderMaterialCompletionLabel(completionSummary)}
        </AppBadge>
      </div>

      <div className={mobile ? "mt-2 grid gap-1.5 text-[11px]" : "mt-2 grid grid-cols-2 gap-1.5 text-[11px]"}>
        <SummaryChip label="구성" value={materialSummaryLabel} />
        <SummaryChip label="상태" value={remainingSummaryLabel} />
      </div>

      <details className="group mt-2.5">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl bg-[var(--pbp-surface-soft)] px-3 py-2 text-[11px] font-semibold pbp-text-muted transition hover:bg-[var(--pbp-surface-muted)]">
          <span>발주 대기 자재 · {materialItemsCount}개</span>
          <span aria-hidden="true" className="transition group-open:rotate-180">▾</span>
        </summary>
        <div className="mt-2 grid gap-1.5">
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
              mobile={mobile}
            />
          ))}
        </div>
      </details>
    </AppCard>
  );
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <span className="min-w-0 rounded-2xl bg-[var(--pbp-surface-soft)] px-2.5 py-2">
      <span className="block text-[10px] font-semibold pbp-text-subtle">{label}</span>
      <span className="mt-0.5 block truncate font-semibold pbp-text-muted">{value}</span>
    </span>
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
  mobile = false,
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
  mobile?: boolean;
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

  const selectionButtonLabel = isAdded
    ? "선택됨"
    : isCompletionFulfilled
      ? "발주 완료"
      : isAllocationCovered
        ? "진행중"
        : "선택";
  const selectionButtonTitle = resolveMaterialSelectionButtonTitle({
    editable,
    isAdded,
    isCompletionFulfilled,
    isAllocationCovered,
  });

  return (
    <AppCard padding="none" variant="flat" className={`${MATERIAL_ORDER_NESTED_ROW_CLASS} ${mobile ? "grid gap-2" : ""}`}>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <AppBadge tone="neutral" size="sm" className="shrink-0 text-[10px]">
            {formatMaterialItemTypeLabel(material.itemType)}
          </AppBadge>
          <p className="truncate text-xs font-semibold pbp-text-primary">{material.itemName}</p>
        </div>
        <p className="mt-1 text-[11px] pbp-text-muted">
          필요 수량 {formatMaterialQuantity(material.quantity, material.unit)} · {readableStatus}
        </p>
        {mobile ? (
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-semibold pbp-text-subtle">
            <span className="rounded-xl bg-[var(--pbp-surface-soft)] px-2 py-1.5">진행 {formatMaterialQuantity(orderedQuantity, material.unit)}</span>
            <span className="rounded-xl bg-[var(--pbp-surface-soft)] px-2 py-1.5 text-right">남음 {formatMaterialQuantity(completionRemainingQuantity, material.unit)}</span>
          </div>
        ) : null}
      </div>
      <AppButton
        size="sm"
        className={mobile ? "min-h-9 w-full px-3 py-1 text-xs" : "min-h-7 px-3 py-1 text-xs"}
        variant={isAdded || isAllocationCovered ? "ghost" : "secondary"}
        disabled={!editable || isAdded || isAllocationCovered}
        title={selectionButtonTitle}
        aria-label={`${material.itemName} ${selectionButtonLabel}`}
        onClick={() => onAddMaterialToOrder(workOrder, material)}
      >
        {selectionButtonLabel}
      </AppButton>
    </AppCard>
  );
}

function fieldClassName(extra = "") {
  return [
    MATERIAL_ORDER_PANEL_FILTER_FIELD_CLASS,
    extra,
  ].filter(Boolean).join(" ");
}

function resolveMaterialSelectionButtonTitle({
  editable,
  isAdded,
  isCompletionFulfilled,
  isAllocationCovered,
}: {
  editable: boolean;
  isAdded: boolean;
  isCompletionFulfilled: boolean;
  isAllocationCovered: boolean;
}) {
  if (!editable) return "작성중 발주서에서만 자재를 선택할 수 있습니다.";
  if (isAdded) return "이번 발주서에 이미 선택된 자재입니다.";
  if (isCompletionFulfilled) return "필요 수량의 자재 발주가 완료되었습니다.";
  if (isAllocationCovered) return "다른 진행 중 발주서에서 필요한 수량이 이미 선택되었습니다.";
  return "이번 발주서에 자재를 추가합니다.";
}

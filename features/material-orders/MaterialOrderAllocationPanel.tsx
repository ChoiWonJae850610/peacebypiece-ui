import { useMemo } from "react";

import { WaflSideWorkspacePanel, WaflSurface } from "@/components/common/ui";
import MaterialOrderPanelMessage from "@/features/material-orders/components/MaterialOrderPanelMessage";
import { MaterialOrderActionButton } from "@/features/material-orders/components/MaterialOrderActionButton";
import {
  MATERIAL_ORDER_LIST_CARD_BASE_CLASS,
  MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS,
  MATERIAL_ORDER_NESTED_ROW_CLASS,
  MATERIAL_ORDER_PANEL_LIST_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import { type MaterialOrderDraftLine } from "@/lib/material-orders/materialOrderDraftCalculator";
import {
  calculateMaterialRequestCompletionRemainingQuantity,
  calculateMaterialRequestCurrentDraftQuantity,
  calculateMaterialRequestOrderedQuantity,
  calculateMaterialRequestRemainingQuantity,
  formatMaterialQuantity,
  isMaterialRequestAlreadyAdded,
  type MaterialRequestQuantityMap,
} from "@/features/material-orders/materialOrderPanelUtils";
import type { MaterialOrderDraftSelectionType, MaterialOrderDraftType } from "@/lib/material-orders/materialOrderDraftCalculator";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";

type MaterialOrderAllocationPanelProps = {
  candidates: MaterialOrderWorkspaceWorkOrderCandidate[];
  lines: MaterialOrderDraftLine[];
  materialRequestQuantityMap: MaterialRequestQuantityMap;
  materialRequestCompletionMap: MaterialRequestQuantityMap;
  selectedMaterialType: MaterialOrderDraftSelectionType;
  hasSelectedOrder: boolean;
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
  selectedMaterialType,
  hasSelectedOrder,
  editable,
  loading,
  errorMessage,
  onAddMaterialToOrder,
  onRetry,
  mobile = false,
}: MaterialOrderAllocationPanelProps) {
  const visibleCandidates = useMemo(
    () => {
      if (!selectedMaterialType) return [];

      return candidates.flatMap((workOrder) => {
        const materialItems = workOrder.materialItems.filter((material) =>
          shouldShowMaterialRequest({
            workOrderId: workOrder.id,
            material,
            selectedMaterialType,
            materialRequestQuantityMap,
            materialRequestCompletionMap,
          }),
        );

        return materialItems.length > 0
          ? [{ ...workOrder, materialItems }]
          : [];
      });
    },
    [
      candidates,
      materialRequestCompletionMap,
      materialRequestQuantityMap,
      selectedMaterialType,
    ],
  );

  return (
    <WaflSideWorkspacePanel>
      {!hasSelectedOrder || !selectedMaterialType ? (
        <div aria-hidden="true" />
      ) : (
        <div className={MATERIAL_ORDER_PANEL_LIST_CLASS}>
          {loading ? (
            <MaterialOrderPanelMessage
              title="불러오는 중"
              description="자재 발주 대기 작업지시서를 조회하고 있습니다."
              kind="loading"
            />
          ) : errorMessage ? (
            <MaterialOrderPanelMessage
              title="조회 실패"
              description={errorMessage}
              actionLabel="다시 조회"
              onAction={onRetry}
              kind="error"
            />
          ) : visibleCandidates.length === 0 ? (
            <MaterialOrderPanelMessage
              title="선택 가능한 자재 없음"
              description="현재 자재 종류에서 발주할 작업지시서가 없습니다."
            />
          ) : (
            visibleCandidates.map((workOrder) => (
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
      )}
    </WaflSideWorkspacePanel>
  );
}

type AllocationCandidateMaterialItem =
  MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number];

function shouldShowMaterialRequest({
  workOrderId,
  material,
  selectedMaterialType,
  materialRequestQuantityMap,
  materialRequestCompletionMap,
}: {
  workOrderId: string;
  material: AllocationCandidateMaterialItem;
  selectedMaterialType: MaterialOrderDraftSelectionType;
  materialRequestQuantityMap: MaterialRequestQuantityMap;
  materialRequestCompletionMap: MaterialRequestQuantityMap;
}) {
  if (material.itemType !== selectedMaterialType) return false;

  const currentDraftQuantity = calculateMaterialRequestCurrentDraftQuantity(
    materialRequestQuantityMap,
    workOrderId,
    material.key,
  );
  const remainingQuantity = calculateMaterialRequestRemainingQuantity({
    quantityMap: materialRequestQuantityMap,
    workOrderId,
    materialKey: material.key,
    requiredQuantity: material.quantity,
  });
  const completionRemainingQuantity =
    calculateMaterialRequestCompletionRemainingQuantity({
      quantityMap: materialRequestCompletionMap,
      workOrderId,
      materialKey: material.key,
      requiredQuantity: material.quantity,
    });

  if (currentDraftQuantity > 0) return true;
  if (completionRemainingQuantity <= 0) return false;
  return remainingQuantity > 0;
}

function formatMaterialTypeCountLabel(
  materialType: MaterialOrderDraftType,
  count: number,
) {
  return `${materialType === "fabric" ? "원단" : "부자재"} ${count}종`;
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
  const materialTypeLabel = workOrder.materialItems[0]
    ? formatMaterialTypeCountLabel(
        workOrder.materialItems[0].itemType,
        workOrder.materialItems.length,
      )
    : "자재 0종";

  return (
    <WaflSurface
      component="material-order-allocation-card"
      shape="control"
      className={`${MATERIAL_ORDER_LIST_CARD_BASE_CLASS} ${MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS} p-3`}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold pbp-text-primary">
              {workOrder.productName || workOrder.code}
            </p>
            <p className="mt-1 text-[11px] pbp-text-subtle">
              {workOrder.managerLabel} · {workOrder.dueDateLabel}
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-semibold pbp-text-muted">
            {materialTypeLabel}
          </span>
        </div>
      </div>

      <div className="mt-2.5 grid gap-1.5">
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
    </WaflSurface>
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
  const completionRemainingQuantity =
    calculateMaterialRequestCompletionRemainingQuantity({
      quantityMap: materialRequestCompletionMap,
      workOrderId: workOrder.id,
      materialKey: material.key,
      requiredQuantity: material.quantity,
    });
  const isCompletionFulfilled = completionRemainingQuantity <= 0;
  const isAllocationCovered = remainingQuantity <= 0;
  const selectionButtonLabel = isAdded
    ? "빼기"
    : isAllocationCovered
      ? "대기"
      : "추가";
  const selectionButtonTitle = resolveMaterialSelectionButtonTitle({
    editable,
    isAdded,
    isCompletionFulfilled,
    isAllocationCovered,
  });

  return (
    <WaflSurface
      component="material-order-material-row"
      shape="control"
      className={`${MATERIAL_ORDER_NESTED_ROW_CLASS} ${mobile ? "grid gap-2" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold pbp-text-primary">
            {material.itemName}
          </p>
          <MaterialRequestQuantityRatio
            orderedQuantity={orderedQuantity}
            requiredQuantity={material.quantity}
            currentDraftQuantity={currentDraftQuantity}
            unit={material.unit}
          />
        </div>
        {currentDraftQuantity > 0 ? (
          <p className="mt-1 text-[10px] font-semibold text-[var(--pbp-status-success-fg)]">
            이번 발주서에 선택됨
          </p>
        ) : null}
      </div>
      <MaterialOrderActionButton
        label={`${material.itemName} ${selectionButtonLabel}`}
        size="sm"
        compact
        showSrLabel={false}
        tone={isAdded ? "neutral" : isAllocationCovered ? "neutral" : "primary"}
        className={mobile ? "w-full" : ""}
        disabled={
          !editable ||
          isCompletionFulfilled ||
          (!isAdded && isAllocationCovered)
        }
        title={selectionButtonTitle}
        onClick={() => onAddMaterialToOrder(workOrder, material)}
      >
        <span aria-hidden="true">{selectionButtonLabel}</span>
      </MaterialOrderActionButton>
    </WaflSurface>
  );
}

function MaterialRequestQuantityRatio({
  orderedQuantity,
  requiredQuantity,
  currentDraftQuantity,
  unit,
}: {
  orderedQuantity: number;
  requiredQuantity: number;
  currentDraftQuantity: number;
  unit: string;
}) {
  const normalizedOrderedQuantity =
    normalizeMaterialQuantityNumber(orderedQuantity);
  const normalizedRequiredQuantity =
    normalizeMaterialQuantityNumber(requiredQuantity);
  const numberClassName = resolveMaterialQuantityNumberClassName({
    orderedQuantity,
    requiredQuantity,
    currentDraftQuantity,
  });

  return (
    <span
      className="shrink-0 whitespace-nowrap text-xs font-semibold pbp-text-muted"
      title={formatMaterialQuantity(orderedQuantity, unit)}
    >
      <span className={numberClassName}>{normalizedOrderedQuantity}</span>
      <span className="pbp-text-subtle">/{normalizedRequiredQuantity}</span>
      {unit.trim() ? (
        <span className="ml-1 text-[10px] pbp-text-subtle">{unit.trim()}</span>
      ) : null}
    </span>
  );
}

function normalizeMaterialQuantityNumber(value: number) {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  if (Number.isInteger(normalizedValue)) return String(normalizedValue);
  return normalizedValue
    .toFixed(3)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

function resolveMaterialQuantityNumberClassName({
  orderedQuantity,
  requiredQuantity,
  currentDraftQuantity,
}: {
  orderedQuantity: number;
  requiredQuantity: number;
  currentDraftQuantity: number;
}) {
  if (orderedQuantity <= 0) return "text-[var(--pbp-status-danger-fg)]";
  if (orderedQuantity >= requiredQuantity && currentDraftQuantity > 0)
    return "text-[var(--pbp-status-success-fg)]";
  if (orderedQuantity >= requiredQuantity)
    return "text-[var(--pbp-status-info-fg)]";
  return "text-[var(--pbp-status-warning-fg)]";
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
  if (isAdded) return "이번 발주서에서 선택한 자재를 뺍니다.";
  if (isCompletionFulfilled) return "필요 수량의 자재 발주가 완료되었습니다.";
  if (isAllocationCovered)
    return "다른 진행 중 발주서에서 필요한 수량이 이미 선택되었습니다.";
  return "이번 발주서에 자재를 추가합니다.";
}

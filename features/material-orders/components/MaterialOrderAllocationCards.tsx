import { WaflSurface } from "@/components/common/ui";
import { MaterialOrderActionButton } from "@/features/material-orders/components/MaterialOrderActionButton";
import { MaterialOrderQuantityRatio } from "@/features/material-orders/components/MaterialOrderQuantityDisplay";
import {
  MATERIAL_ORDER_LIST_CARD_BASE_CLASS,
  MATERIAL_ORDER_LIST_CARD_DEFAULT_CLASS,
  MATERIAL_ORDER_NESTED_ROW_CLASS,
} from "@/features/material-orders/materialOrderWorkspaceStyles";
import {
  calculateMaterialRequestCompletionRemainingQuantity,
  calculateMaterialRequestCurrentDraftQuantity,
  calculateMaterialRequestOrderedQuantity,
  calculateMaterialRequestRemainingQuantity,
  formatMaterialItemTypeCountLabel,
  isMaterialRequestAlreadyAdded,
  type MaterialRequestQuantityMap,
} from "@/features/material-orders/materialOrderPanelUtils";
import type { MaterialOrderDraftLine } from "@/lib/material-orders/materialOrderDraftCalculator";
import type { MaterialOrderWorkspaceWorkOrderCandidate } from "@/lib/material-orders/materialOrderWorkspaceClient";

type MaterialOrderAllocationCardProps = {
  workOrder: MaterialOrderWorkspaceWorkOrderCandidate;
  lines: MaterialOrderDraftLine[];
  materialRequestQuantityMap: MaterialRequestQuantityMap;
  materialRequestCompletionMap: MaterialRequestQuantityMap;
  editable: boolean;
  onAddMaterialToOrder: (
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => void;
  onAddMaterialToOrderDrawer: (
    workOrder: MaterialOrderWorkspaceWorkOrderCandidate,
    material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number],
  ) => void;
  mobile?: boolean;
};

export function MaterialOrderAllocationCard({
  workOrder,
  lines,
  materialRequestQuantityMap,
  materialRequestCompletionMap,
  editable,
  onAddMaterialToOrder,
  onAddMaterialToOrderDrawer,
  mobile = false,
}: MaterialOrderAllocationCardProps) {
  const materialTypeLabel = workOrder.materialItems[0]
    ? formatMaterialItemTypeCountLabel(
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
          <MaterialOrderAllocationRow
            key={material.key}
            workOrder={workOrder}
            material={material}
            lines={lines}
            materialRequestQuantityMap={materialRequestQuantityMap}
            materialRequestCompletionMap={materialRequestCompletionMap}
            editable={editable}
            onAddMaterialToOrder={onAddMaterialToOrder}
            onAddMaterialToOrderDrawer={onAddMaterialToOrderDrawer}
            mobile={mobile}
          />
        ))}
      </div>
    </WaflSurface>
  );
}

function MaterialOrderAllocationRow({
  workOrder,
  material,
  lines,
  materialRequestQuantityMap,
  materialRequestCompletionMap,
  editable,
  onAddMaterialToOrder,
  onAddMaterialToOrderDrawer,
  mobile = false,
}: MaterialOrderAllocationCardProps & {
  material: MaterialOrderWorkspaceWorkOrderCandidate["materialItems"][number];
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
          <MaterialOrderQuantityRatio
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
      <div className={mobile ? "grid grid-cols-2 gap-1.5" : "flex shrink-0 items-center gap-1.5"}>
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
        <MaterialOrderActionButton
          label={`${material.itemName} 오른쪽 드로어 테스트`}
          size="sm"
          compact
          showSrLabel={false}
          tone="neutral"
          className={mobile ? "w-full" : ""}
          disabled={
            !editable ||
            isAdded ||
            isCompletionFulfilled ||
            isAllocationCovered
          }
          title="오른쪽 드로어 방식으로 발주 품목 추가를 테스트합니다."
          onClick={() => onAddMaterialToOrderDrawer(workOrder, material)}
        >
          <span aria-hidden="true">드로어</span>
        </MaterialOrderActionButton>
      </div>
    </WaflSurface>
  );
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

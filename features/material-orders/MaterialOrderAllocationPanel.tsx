import { useMemo } from "react";

import { WaflSideWorkspacePanel } from "@/components/common/ui";
import { MaterialOrderAllocationCard } from "@/features/material-orders/components/MaterialOrderAllocationCards";
import MaterialOrderPanelMessage from "@/features/material-orders/components/MaterialOrderPanelMessage";
import { MATERIAL_ORDER_EMPTY_STATE_COPY } from "@/features/material-orders/materialOrderEmptyStates";
import { MATERIAL_ORDER_PANEL_LIST_CLASS } from "@/features/material-orders/materialOrderWorkspaceStyles";
import { type MaterialOrderDraftLine } from "@/lib/material-orders/materialOrderDraftCalculator";
import {
  calculateMaterialRequestCompletionRemainingQuantity,
  calculateMaterialRequestCurrentDraftQuantity,
  calculateMaterialRequestRemainingQuantity,
  type MaterialRequestQuantityMap,
} from "@/features/material-orders/materialOrderPanelUtils";
import type { MaterialOrderDraftSelectionType } from "@/lib/material-orders/materialOrderDraftCalculator";
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
  onOpenCleanModal: () => void;
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
  onOpenCleanModal,
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
      {!hasSelectedOrder ? (
        <MaterialOrderPanelMessage
          title={MATERIAL_ORDER_EMPTY_STATE_COPY.selectTarget.title}
          description={MATERIAL_ORDER_EMPTY_STATE_COPY.selectTarget.description}
        />
      ) : !selectedMaterialType ? (
        <MaterialOrderPanelMessage
          title={MATERIAL_ORDER_EMPTY_STATE_COPY.selectMaterialType.title}
          description={MATERIAL_ORDER_EMPTY_STATE_COPY.selectMaterialType.description}
        />
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
              title={MATERIAL_ORDER_EMPTY_STATE_COPY.noAvailableMaterial.title}
              description={MATERIAL_ORDER_EMPTY_STATE_COPY.noAvailableMaterial.description}
            />
          ) : (
            visibleCandidates.map((workOrder) => (
              <MaterialOrderAllocationCard
                key={workOrder.id}
                workOrder={workOrder}
                lines={lines}
                materialRequestQuantityMap={materialRequestQuantityMap}
                materialRequestCompletionMap={materialRequestCompletionMap}
                editable={editable}
                onAddMaterialToOrder={onAddMaterialToOrder}
                onOpenCleanModal={onOpenCleanModal}
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

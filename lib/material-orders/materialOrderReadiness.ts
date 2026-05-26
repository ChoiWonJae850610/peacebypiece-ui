import { WORKFLOW_STATE } from "@/lib/constants/workorderStates";
import type { WorkOrderSummary } from "@/types/workorder";

export const MATERIAL_ORDER_READINESS_STATUS = {
  notReady: "not_ready",
  materialOrderPending: "material_order_pending",
  materialOrderInProgress: "material_order_in_progress",
  materialOrderCompleted: "material_order_completed",
} as const;

export const MATERIAL_ORDER_READINESS_STATUSES = [
  MATERIAL_ORDER_READINESS_STATUS.notReady,
  MATERIAL_ORDER_READINESS_STATUS.materialOrderPending,
  MATERIAL_ORDER_READINESS_STATUS.materialOrderInProgress,
  MATERIAL_ORDER_READINESS_STATUS.materialOrderCompleted,
] as const;

export type MaterialOrderReadinessStatus = (typeof MATERIAL_ORDER_READINESS_STATUSES)[number];

export type MaterialOrderReadinessSummary = {
  status: MaterialOrderReadinessStatus;
  label: string;
  description: string;
  candidate: boolean;
};

export function resolveMaterialOrderReadinessStatus(workOrder: Pick<WorkOrderSummary, "workflowState" | "materialItems">): MaterialOrderReadinessStatus {
  const hasMaterialItems = Array.isArray(workOrder.materialItems)
    && workOrder.materialItems.some((item) => item.itemName.trim().length > 0);

  if (!hasMaterialItems) return MATERIAL_ORDER_READINESS_STATUS.notReady;

  if (workOrder.workflowState === WORKFLOW_STATE.materialOrderPending) {
    return MATERIAL_ORDER_READINESS_STATUS.materialOrderPending;
  }

  if (workOrder.workflowState === WORKFLOW_STATE.completed) {
    return MATERIAL_ORDER_READINESS_STATUS.materialOrderCompleted;
  }

  return MATERIAL_ORDER_READINESS_STATUS.notReady;
}

export function getMaterialOrderReadinessSummary(status: MaterialOrderReadinessStatus): MaterialOrderReadinessSummary {
  switch (status) {
    case MATERIAL_ORDER_READINESS_STATUS.materialOrderPending:
      return {
        status,
        label: "자재 발주 대기",
        description: "작업지시서 발주요청은 완료됐지만 원단·부자재 발주가 완료되지 않은 상태입니다.",
        candidate: true,
      };
    case MATERIAL_ORDER_READINESS_STATUS.materialOrderInProgress:
      return {
        status,
        label: "자재 발주 진행중",
        description: "자재 발주가 일부 진행 중인 상태입니다.",
        candidate: false,
      };
    case MATERIAL_ORDER_READINESS_STATUS.materialOrderCompleted:
      return {
        status,
        label: "자재 발주 완료",
        description: "작업지시서 완료 단계입니다. 신규 발주 후보에는 포함하지 않습니다.",
        candidate: false,
      };
    case MATERIAL_ORDER_READINESS_STATUS.notReady:
    default:
      return {
        status: MATERIAL_ORDER_READINESS_STATUS.notReady,
        label: "자재 발주 대상 아님",
        description: "필요 자재가 없거나 아직 발주 후보 단계가 아닙니다.",
        candidate: false,
      };
  }
}

export function isMaterialOrderCandidateWorkOrder(workOrder: Pick<WorkOrderSummary, "workflowState" | "materialItems">): boolean {
  return getMaterialOrderReadinessSummary(resolveMaterialOrderReadinessStatus(workOrder)).candidate;
}

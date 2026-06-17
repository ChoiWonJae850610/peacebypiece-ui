export const WAFL_CHANGE_TARGET = {
  workOrder: "workOrder",
  workOrderManager: "workOrderManager",
  workOrderInventory: "workOrderInventory",
  workOrderDueDate: "workOrderDueDate",
  workOrderQuantity: "workOrderQuantity",
  workOrderKind: "workOrderKind",
  workOrderTitle: "workOrderTitle",
  factoryInstruction: "factoryInstruction",
  materialOrder: "materialOrder",
  materialOrderStatus: "materialOrderStatus",
  materialOrderDueDate: "materialOrderDueDate",
  materialOrderMaterialType: "materialOrderMaterialType",
  materialOrderSupplier: "materialOrderSupplier",
} as const;

export type WaflChangeTarget =
  (typeof WAFL_CHANGE_TARGET)[keyof typeof WAFL_CHANGE_TARGET];
export type WaflChangeFeedbackStatus = "changing" | "changed" | "error";

const TARGET_PROGRESS_LABEL: Record<WaflChangeTarget, string> = {
  workOrder: "작업지시서 정보",
  workOrderManager: "작업지시서 기본정보(담당자)",
  workOrderInventory: "작업지시서 기본정보(재고 수량)",
  workOrderDueDate: "작업지시서 기본정보(납기일)",
  workOrderQuantity: "작업지시서 기본정보(수량)",
  workOrderKind: "작업지시서 기본정보(분류)",
  workOrderTitle: "작업지시서 기본정보(작업지시서명)",
  factoryInstruction: "작업지시서 공장 전달사항",
  materialOrder: "발주서 정보",
  materialOrderStatus: "발주서 상태",
  materialOrderDueDate: "발주서 기본정보(납기일)",
  materialOrderMaterialType: "발주서 기본정보(자재 종류)",
  materialOrderSupplier: "발주서 기본정보(공급처)",
};

export function getWaflChangeFeedbackMessage(
  target: WaflChangeTarget,
  status: WaflChangeFeedbackStatus,
): string {
  if (status === "changing") {
    return `${TARGET_PROGRESS_LABEL[target]} 변경 중입니다.`;
  }
  if (status === "changed") return "정보가 변경되었습니다.";
  return "정보를 변경하지 못했습니다.";
}

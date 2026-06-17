export const WAFL_SAVE_TARGET = {
  workOrder: "workOrder",
  dueDate: "dueDate",
  materialType: "materialType",
  supplier: "supplier",
  factoryInstruction: "factoryInstruction",
} as const;

export type WaflSaveTarget = (typeof WAFL_SAVE_TARGET)[keyof typeof WAFL_SAVE_TARGET];
export type WaflSaveFeedbackStatus = "saving" | "saved" | "error";

const TARGET_LABEL: Record<WaflSaveTarget, string> = {
  workOrder: "변경사항",
  dueDate: "납기일",
  materialType: "자재 종류",
  supplier: "공급처",
  factoryInstruction: "공장 전달사항",
};

export function getWaflSaveFeedbackMessage(
  target: WaflSaveTarget,
  status: WaflSaveFeedbackStatus,
): string {
  const label = TARGET_LABEL[target];
  if (status === "saving") return `${label} 저장 중입니다.`;
  if (status === "saved") return `${label}이 저장되었습니다.`;
  return `${label}을 저장하지 못했습니다.`;
}

import type { AttachmentScope } from "@/types/workorder";

export type WorkOrderSaveTiming = "immediate" | "action";
export type WorkOrderSaveTarget =
  | "memo"
  | "design"
  | "attachment"
  | "workOrderTitle"
  | "assignee"
  | "inventory"
  | "factory"
  | "material"
  | "subsidiary"
  | "order"
  | "production";

export const WORK_ORDER_SAVE_POLICY: Record<WorkOrderSaveTarget, WorkOrderSaveTiming> = {
  memo: "immediate",
  design: "immediate",
  attachment: "immediate",
  workOrderTitle: "immediate",
  assignee: "immediate",
  inventory: "immediate",
  factory: "action",
  material: "action",
  subsidiary: "action",
  order: "action",
  production: "action",
};

export function getAttachmentSaveTarget(scope: AttachmentScope): "design" | "attachment" {
  return scope === "design" ? "design" : "attachment";
}

export function shouldSaveWorkOrderTargetImmediately(target: WorkOrderSaveTarget): boolean {
  return WORK_ORDER_SAVE_POLICY[target] === "immediate";
}

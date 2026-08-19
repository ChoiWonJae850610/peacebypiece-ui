import type { WorkOrderProcessStatus } from "@/domain/mobileContract";

export type ProductionOrderAction = "request" | "cancel" | "complete";

export type ProductionOrderPolicy = {
  readonly label: "발주 전" | "발주요청" | "발주완료";
  readonly locked: boolean;
  readonly canEdit: boolean;
  readonly actions: readonly ProductionOrderAction[];
};

export function resolveProductionOrderPolicy(input: {
  readonly status: WorkOrderProcessStatus;
  readonly currentDraft: boolean;
  readonly editable: boolean;
}): ProductionOrderPolicy {
  if (input.status === "ready") {
    const canEdit = input.currentDraft && input.editable;
    return { label: "발주 전", locked: !canEdit, canEdit, actions: canEdit ? ["request"] : [] };
  }
  if (input.status === "in_progress") {
    return {
      label: "발주요청",
      locked: true,
      canEdit: false,
      actions: input.currentDraft ? ["complete", "cancel"] : [],
    };
  }
  return { label: "발주완료", locked: true, canEdit: false, actions: [] };
}

import { getDisplayOrderInspectionStatus } from "@/lib/constants/workorderStates";
import { getI18n } from "@/lib/i18n";
import type { DisplayStage, WorkflowState } from "@/types/workflow";
import type { OrderInspectionStatus } from "@/types/workorder";

type I18n = ReturnType<typeof getI18n>;

export function translateWorkflowStateLabel(state: WorkflowState, i18n: I18n) {
  return i18n.workorder.workflowStates[state];
}

export function translateDisplayStageLabel(stage: DisplayStage, i18n: I18n) {
  return i18n.workorder.displayStages[stage];
}

export function translateInspectionStatusLabel(status: OrderInspectionStatus | null | undefined, i18n: I18n) {
  return i18n.workorder.inspectionStatuses[getDisplayOrderInspectionStatus(status)];
}

import type { Dispatch, SetStateAction } from "react";
import type { HistoryLog, WorkOrder } from "@/types/workorder";
import {
  mergeSavedWorkOrders,
  mergeSavedWorkOrdersPreservingDraftOnlyFields,
  replaceWorkOrderById,
} from "./workorderRepositoryMutations";
import type { SaveStatus } from "./useWorkOrderActionTypes";

export type WorkflowActionSideEffectPayload = {
  historyLogs?: HistoryLog[] | null;
  toastMessage?: string | null;
  openInventoryEditor?: boolean;
};

export type WorkflowActionSideEffectSetters = {
  setHistoryLogs: Dispatch<SetStateAction<HistoryLog[]>>;
  setToastMessage: Dispatch<SetStateAction<string | null>>;
  setInventoryEditorOpen?: Dispatch<SetStateAction<boolean>>;
};

export function replaceWorkflowPersistedWorkOrder(
  workOrders: WorkOrder[],
  workOrderId: string,
  persistedWorkOrder: WorkOrder,
): WorkOrder[] {
  return workOrders.map((item) => (item.id === workOrderId ? persistedWorkOrder : item));
}

export function markWorkflowPersistStarted(setSaveStatus: Dispatch<SetStateAction<SaveStatus>>): void {
  setSaveStatus("saving");
}

export function markWorkflowPersistFailed(
  setSaveStatus: Dispatch<SetStateAction<SaveStatus>>,
  setToastMessage: Dispatch<SetStateAction<string | null>>,
  error: unknown,
): void {
  setSaveStatus("dirty");
  setToastMessage(error instanceof Error ? error.message : null);
}

export function applyWorkflowActionSideEffects(
  payload: WorkflowActionSideEffectPayload,
  setters: WorkflowActionSideEffectSetters,
): void {
  if (payload.historyLogs?.length) {
    setters.setHistoryLogs((prev) => [...payload.historyLogs!, ...prev]);
  }

  if (payload.openInventoryEditor) {
    setters.setInventoryEditorOpen?.(true);
  }

  if (payload.toastMessage) {
    setters.setToastMessage(payload.toastMessage);
  }
}

export type ImmediatePatchPersistSuccessInput = {
  baseWorkOrders: WorkOrder[];
  workOrderId: string;
  persistedWorkOrder: WorkOrder;
};

export type ImmediatePatchPersistSuccessResult = {
  localWorkOrders: WorkOrder[];
  persistedWorkOrders: WorkOrder[];
};

export function buildImmediatePatchPersistSuccessState({
  baseWorkOrders,
  workOrderId,
  persistedWorkOrder,
}: ImmediatePatchPersistSuccessInput): ImmediatePatchPersistSuccessResult {
  return {
    localWorkOrders: mergeSavedWorkOrdersPreservingDraftOnlyFields(baseWorkOrders, [persistedWorkOrder]),
    persistedWorkOrders: replaceWorkOrderById(baseWorkOrders, workOrderId, persistedWorkOrder),
  };
}


export type SharedProductionPersistSuccessInput = {
  optimisticWorkOrders: WorkOrder[];
  persistedWorkOrders: WorkOrder[];
};

export type SharedProductionPersistSuccessResult = {
  localWorkOrders: WorkOrder[];
  persistedWorkOrders: WorkOrder[];
};

export function buildSharedProductionPersistSuccessState({
  optimisticWorkOrders,
  persistedWorkOrders,
}: SharedProductionPersistSuccessInput): SharedProductionPersistSuccessResult {
  const mergedWorkOrders = mergeSavedWorkOrders(optimisticWorkOrders, persistedWorkOrders);

  return {
    localWorkOrders: mergedWorkOrders,
    persistedWorkOrders: mergedWorkOrders,
  };
}

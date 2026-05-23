import type { Dispatch, MutableRefObject, SetStateAction } from "react";
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

export type WorkflowWorkOrderStateSetters = {
  workOrdersRef: MutableRefObject<WorkOrder[]>;
  setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  setPersistedWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  syncSelectedWorkOrderSaveState: (nextWorkOrders: WorkOrder[]) => void;
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


export type ApplySharedProductionPersistSuccessInput = SharedProductionPersistSuccessInput & {
  state: WorkflowWorkOrderStateSetters;
};

export function applySharedProductionPersistSuccess({
  optimisticWorkOrders,
  persistedWorkOrders,
  state,
}: ApplySharedProductionPersistSuccessInput): SharedProductionPersistSuccessResult {
  const result = buildSharedProductionPersistSuccessState({
    optimisticWorkOrders,
    persistedWorkOrders,
  });

  state.workOrdersRef.current = result.localWorkOrders;
  state.setWorkOrders(result.localWorkOrders);
  state.setPersistedWorkOrders(result.persistedWorkOrders);
  state.syncSelectedWorkOrderSaveState(result.persistedWorkOrders);

  return result;
}

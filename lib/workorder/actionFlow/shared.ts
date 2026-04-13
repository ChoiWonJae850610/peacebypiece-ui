import type { HistoryLog, WorkOrder } from "@/types/workorder";
import type { AsyncOperationStatus } from "@/lib/hooks/workorder/useWorkOrderActionTypes";
import { DEFAULT_LOCALE, getI18n } from "@/lib/i18n";

export type WorkOrderAsyncActionKey = "save" | "create" | "reorder" | "delete" | "rename";
export type WorkOrderAsyncActionState = Record<WorkOrderAsyncActionKey, AsyncOperationStatus>;

export type WorkOrderAsyncActionFailureKind = "repository" | "validation" | "unknown";

export type WorkOrderAsyncActionFailure = {
  actionKey: WorkOrderAsyncActionKey;
  kind: WorkOrderAsyncActionFailureKind;
  message: string;
  retryable: boolean;
  occurredAt: string;
};

export type WorkOrderAsyncActionFailureState = Record<WorkOrderAsyncActionKey, WorkOrderAsyncActionFailure | null>;
export type WorkOrderAsyncActionErrorState = Record<WorkOrderAsyncActionKey, string | null>;

export const INITIAL_WORKORDER_ASYNC_ACTION_STATE: WorkOrderAsyncActionState = {
  save: "idle",
  create: "idle",
  reorder: "idle",
  delete: "idle",
  rename: "idle",
};

export const INITIAL_WORKORDER_ASYNC_ACTION_FAILURE_STATE: WorkOrderAsyncActionFailureState = {
  save: null,
  create: null,
  reorder: null,
  delete: null,
  rename: null,
};

export const INITIAL_WORKORDER_ASYNC_ACTION_ERROR_STATE: WorkOrderAsyncActionErrorState = {
  save: null,
  create: null,
  reorder: null,
  delete: null,
  rename: null,
};

export function createWorkOrderActionFailure(payload: {
  actionKey: WorkOrderAsyncActionKey;
  error: unknown;
  message?: string;
  kind?: WorkOrderAsyncActionFailureKind;
  retryable?: boolean;
}): WorkOrderAsyncActionFailure {
  return {
    actionKey: payload.actionKey,
    kind: payload.kind ?? "unknown",
    message: payload.message ?? (payload.error instanceof Error ? payload.error.message : "Failed to process workorder action."),
    retryable: payload.retryable ?? (payload.kind === "validation" ? false : true),
    occurredAt: new Date().toISOString(),
  };
}

export async function executeWorkOrderAsyncAction<T>(payload: {
  actionKey: WorkOrderAsyncActionKey;
  task: () => Promise<T>;
  setActionStatus: (actionKey: WorkOrderAsyncActionKey, status: AsyncOperationStatus) => void;
  setActionError: (actionKey: WorkOrderAsyncActionKey, message: string | null) => void;
  setActionFailure?: (actionKey: WorkOrderAsyncActionKey, failure: WorkOrderAsyncActionFailure | null) => void;
  getFailure?: (error: unknown) => WorkOrderAsyncActionFailure;
  getErrorMessage?: (error: unknown) => string;
}): Promise<T> {
  payload.setActionStatus(payload.actionKey, "loading");
  payload.setActionError(payload.actionKey, null);
  payload.setActionFailure?.(payload.actionKey, null);

  try {
    const result = await payload.task();
    payload.setActionStatus(payload.actionKey, "ready");
    return result;
  } catch (error) {
    const failure = payload.getFailure?.(error)
      ?? createWorkOrderActionFailure({
        actionKey: payload.actionKey,
        error,
        message: payload.getErrorMessage?.(error),
      });

    payload.setActionFailure?.(payload.actionKey, failure);
    payload.setActionError(payload.actionKey, failure.message);
    payload.setActionStatus(payload.actionKey, "error");
    throw error;
  }
}

const defaultI18n = getI18n(DEFAULT_LOCALE);
export const defaultActionFlowText = defaultI18n.workorder.actionFlow;
export const defaultHistoryText = defaultI18n.workorder.history;

export type ActionFlowText = typeof defaultActionFlowText;
export type ActionFlowHistoryText = typeof defaultHistoryText;

export type WorkOrderActionFlowResult = {
  nextWorkOrder: WorkOrder;
  historyLogs?: HistoryLog[];
  saveStatus?: "dirty" | "saved" | "saving";
  toastMessage?: string;
  openInventoryEditor?: boolean;
  resetAttachmentPreview?: boolean;
  appliedChanges?: import("@/types/workorder").InventoryChange[];
};

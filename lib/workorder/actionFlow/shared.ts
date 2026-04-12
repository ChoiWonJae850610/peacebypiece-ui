import type { HistoryLog, WorkOrder } from "@/types/workorder";
import type { AsyncOperationStatus } from "@/lib/hooks/workorder/useWorkOrderActionTypes";
import { DEFAULT_LOCALE, getI18n } from "@/lib/i18n";

export type WorkOrderAsyncActionKey = "save" | "create" | "reorder" | "delete" | "rename";
export type WorkOrderAsyncActionState = Record<WorkOrderAsyncActionKey, AsyncOperationStatus>;
export type WorkOrderAsyncActionErrorState = Record<WorkOrderAsyncActionKey, string | null>;

export const INITIAL_WORKORDER_ASYNC_ACTION_STATE: WorkOrderAsyncActionState = {
  save: "idle",
  create: "idle",
  reorder: "idle",
  delete: "idle",
  rename: "idle",
};

export const INITIAL_WORKORDER_ASYNC_ACTION_ERROR_STATE: WorkOrderAsyncActionErrorState = {
  save: null,
  create: null,
  reorder: null,
  delete: null,
  rename: null,
};

export async function executeWorkOrderAsyncAction<T>(payload: {
  actionKey: WorkOrderAsyncActionKey;
  task: () => Promise<T>;
  setActionStatus: (actionKey: WorkOrderAsyncActionKey, status: AsyncOperationStatus) => void;
  setActionError: (actionKey: WorkOrderAsyncActionKey, message: string | null) => void;
  getErrorMessage?: (error: unknown) => string;
}): Promise<T> {
  payload.setActionStatus(payload.actionKey, "loading");
  payload.setActionError(payload.actionKey, null);

  try {
    const result = await payload.task();
    payload.setActionStatus(payload.actionKey, "ready");
    return result;
  } catch (error) {
    const message = payload.getErrorMessage?.(error)
      ?? (error instanceof Error ? error.message : "Failed to process workorder action.");
    payload.setActionError(payload.actionKey, message);
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
};

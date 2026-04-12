"use client";

import { useCallback, useMemo, useState } from "react";
import type { AsyncOperationStatus } from "./useWorkOrderActionTypes";
import type { WorkOrderAsyncActionErrorState, WorkOrderAsyncActionKey, WorkOrderAsyncActionState } from "@/lib/workorder/actionFlow";
import {
  INITIAL_WORKORDER_ASYNC_ACTION_ERROR_STATE,
  INITIAL_WORKORDER_ASYNC_ACTION_STATE,
} from "@/lib/workorder/actionFlow";

export function useWorkOrderActionRuntime() {
  const [actionStatusMap, setActionStatusMap] = useState<WorkOrderAsyncActionState>(INITIAL_WORKORDER_ASYNC_ACTION_STATE);
  const [actionErrorMap, setActionErrorMap] = useState<WorkOrderAsyncActionErrorState>(INITIAL_WORKORDER_ASYNC_ACTION_ERROR_STATE);

  const setActionStatus = useCallback((actionKey: WorkOrderAsyncActionKey, status: AsyncOperationStatus) => {
    setActionStatusMap((prev) => (prev[actionKey] === status ? prev : { ...prev, [actionKey]: status }));
  }, []);

  const setActionError = useCallback((actionKey: WorkOrderAsyncActionKey, message: string | null) => {
    setActionErrorMap((prev) => (prev[actionKey] === message ? prev : { ...prev, [actionKey]: message }));
  }, []);

  const clearActionError = useCallback((actionKey: WorkOrderAsyncActionKey) => {
    setActionError(actionKey, null);
  }, [setActionError]);

  const activeActionKey = useMemo(
    () =>
      (Object.entries(actionStatusMap).find(([, status]) => status === "loading")?.[0] as WorkOrderAsyncActionKey | undefined) ??
      null,
    [actionStatusMap],
  );

  const hasActionError = useMemo(
    () => Object.values(actionErrorMap).some((message) => Boolean(message)),
    [actionErrorMap],
  );

  return {
    actionStatusMap,
    actionErrorMap,
    activeActionKey,
    hasActionError,
    setActionStatus,
    setActionError,
    clearActionError,
  };
}

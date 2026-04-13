"use client";

import { useCallback, useMemo, useState } from "react";
import type { AsyncOperationStatus } from "./useWorkOrderActionTypes";
import type {
  WorkOrderAsyncActionErrorState,
  WorkOrderAsyncActionFailure,
  WorkOrderAsyncActionFailureState,
  WorkOrderAsyncActionKey,
  WorkOrderAsyncActionState,
} from "@/lib/workorder/actionFlow";
import {
  INITIAL_WORKORDER_ASYNC_ACTION_ERROR_STATE,
  INITIAL_WORKORDER_ASYNC_ACTION_FAILURE_STATE,
  INITIAL_WORKORDER_ASYNC_ACTION_STATE,
} from "@/lib/workorder/actionFlow";

export function useWorkOrderActionRuntime() {
  const [actionStatusMap, setActionStatusMap] = useState<WorkOrderAsyncActionState>(INITIAL_WORKORDER_ASYNC_ACTION_STATE);
  const [actionFailureMap, setActionFailureMap] = useState<WorkOrderAsyncActionFailureState>(INITIAL_WORKORDER_ASYNC_ACTION_FAILURE_STATE);

  const actionErrorMap = useMemo<WorkOrderAsyncActionErrorState>(
    () => Object.fromEntries(Object.entries(actionFailureMap).map(([actionKey, failure]) => [actionKey, failure?.message ?? null])) as WorkOrderAsyncActionErrorState,
    [actionFailureMap],
  );

  const setActionStatus = useCallback((actionKey: WorkOrderAsyncActionKey, status: AsyncOperationStatus) => {
    setActionStatusMap((prev) => (prev[actionKey] === status ? prev : { ...prev, [actionKey]: status }));
  }, []);

  const setActionFailure = useCallback((actionKey: WorkOrderAsyncActionKey, failure: WorkOrderAsyncActionFailure | null) => {
    setActionFailureMap((prev) => (prev[actionKey] === failure ? prev : { ...prev, [actionKey]: failure }));
  }, []);

  const setActionError = useCallback((actionKey: WorkOrderAsyncActionKey, message: string | null) => {
    setActionFailureMap((prev) => {
      const previousFailure = prev[actionKey];
      if (previousFailure?.message === message) return prev;
      return {
        ...prev,
        [actionKey]: message
          ? {
              actionKey,
              kind: previousFailure?.kind ?? "unknown",
              message,
              retryable: previousFailure?.retryable ?? true,
              occurredAt: previousFailure?.occurredAt ?? new Date().toISOString(),
            }
          : null,
      };
    });
  }, []);

  const clearActionError = useCallback((actionKey: WorkOrderAsyncActionKey) => {
    setActionFailure(actionKey, null);
  }, [setActionFailure]);

  const activeActionKey = useMemo(
    () =>
      (Object.entries(actionStatusMap).find(([, status]) => status === "loading")?.[0] as WorkOrderAsyncActionKey | undefined) ??
      null,
    [actionStatusMap],
  );

  const hasActionError = useMemo(
    () => Object.values(actionFailureMap).some((failure) => Boolean(failure?.message)),
    [actionFailureMap],
  );

  const latestActionFailure = useMemo(
    () => Object.values(actionFailureMap).filter((failure): failure is WorkOrderAsyncActionFailure => Boolean(failure)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null,
    [actionFailureMap],
  );

  const retryableActionKeys = useMemo(
    () => (Object.entries(actionFailureMap).filter(([, failure]) => Boolean(failure?.retryable)).map(([actionKey]) => actionKey) as WorkOrderAsyncActionKey[]),
    [actionFailureMap],
  );

  return {
    actionStatusMap,
    actionFailureMap,
    actionErrorMap,
    activeActionKey,
    hasActionError,
    latestActionFailure,
    retryableActionKeys,
    setActionStatus,
    setActionError,
    setActionFailure,
    clearActionError,
  };
}

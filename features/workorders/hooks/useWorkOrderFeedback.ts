"use client";

import { useCallback } from "react";

import {
  getWaflChangeFeedbackMessage,
  useWaflMutation,
  type WaflChangeTarget,
  type WaflMutationError,
} from "@/components/common/ui";

type WorkOrderChangeOperationOptions<T> = {
  sequenceKey?: string;
  onSuccess?: (result: T) => void | Promise<void>;
  rollback?: (error: WaflMutationError) => void | Promise<void>;
  getErrorMessage?: (error: unknown) => string | undefined;
};

export function useWorkOrderFeedback() {
  const {
    operation,
    isLocked,
    isLockActive,
    clearOperationToast,
    runMutation,
  } = useWaflMutation("workorder-operation");

  const runChangeOperation = useCallback(
    async <T,>(
      target: WaflChangeTarget,
      operationId: string,
      task: () => T | Promise<T>,
      lockKey = operationId,
      options: WorkOrderChangeOperationOptions<T> = {},
    ): Promise<T | undefined> =>
      runMutation({
        lockKey,
        operationId,
        sequenceKey: options.sequenceKey,
        messages: {
          loading: getWaflChangeFeedbackMessage(target, "changing"),
          success: getWaflChangeFeedbackMessage(target, "changed"),
          error: getWaflChangeFeedbackMessage(target, "error"),
        },
        mutation: task,
        onSuccess: options.onSuccess,
        rollback: options.rollback,
        getErrorMessage: options.getErrorMessage,
      }),
    [runMutation],
  );

  return {
    operation,
    isLocked,
    isLockActive,
    clearOperationToast,
    runChangeOperation,
  };
}

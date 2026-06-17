"use client";

import { useCallback } from "react";

import {
  getWaflChangeFeedbackMessage,
  useWaflMutation,
  type WaflChangeTarget,
} from "@/components/common/ui";

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
    ): Promise<T | undefined> =>
      runMutation({
        lockKey,
        operationId,
        messages: {
          loading: getWaflChangeFeedbackMessage(target, "changing"),
          success: getWaflChangeFeedbackMessage(target, "changed"),
          error: getWaflChangeFeedbackMessage(target, "error"),
        },
        mutation: task,
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

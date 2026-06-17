"use client";

import { useCallback } from "react";

import {
  getWaflChangeFeedbackMessage,
  useWaflToastOperation,
  type WaflChangeTarget,
} from "@/components/common/ui";

export function useWorkOrderFeedback() {
  const { operation, showOperationToast, clearOperationToast } = useWaflToastOperation("workorder-operation");

  const runChangeOperation = useCallback(
    async <T,>(
      target: WaflChangeTarget,
      operationId: string,
      task: () => T | Promise<T>,
    ): Promise<T> => {
      showOperationToast(
        getWaflChangeFeedbackMessage(target, "changing"),
        "loading",
        operationId,
      );

      try {
        const result = await Promise.resolve(task());
        showOperationToast(
          getWaflChangeFeedbackMessage(target, "changed"),
          "success",
          operationId,
        );
        return result;
      } catch (error) {
        showOperationToast(
          error instanceof Error && error.message.trim()
            ? error.message
            : getWaflChangeFeedbackMessage(target, "error"),
          "danger",
          operationId,
        );
        throw error;
      }
    },
    [showOperationToast],
  );

  return {
    operation,
    clearOperationToast,
    runChangeOperation,
  };
}

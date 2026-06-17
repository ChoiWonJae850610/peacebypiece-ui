"use client";

import { useCallback } from "react";

import {
  getWaflChangeFeedbackMessage,
  useWaflMutation,
  type WaflChangeFeedbackStatus,
  type WaflChangeTarget,
} from "@/components/common/ui";

export function useMaterialOrderFeedback() {
  const {
    operation,
    isLocked,
    isLockActive,
    showOperationToast,
    clearOperationToast,
    runMutation,
  } = useWaflMutation("material-order-operation");

  const showChangeFeedback = useCallback(
    (
      target: WaflChangeTarget,
      status: WaflChangeFeedbackStatus,
      message?: string,
    ) => {
      const tone =
        status === "changing"
          ? "loading"
          : status === "changed"
            ? "success"
            : "danger";
      showOperationToast(
        message ?? getWaflChangeFeedbackMessage(target, status),
        tone,
      );
    },
    [showOperationToast],
  );

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
    showOperationToast,
    clearOperationToast,
    showChangeFeedback,
    runChangeOperation,
  };
}

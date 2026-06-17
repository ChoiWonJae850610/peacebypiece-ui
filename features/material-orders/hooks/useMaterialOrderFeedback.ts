"use client";

import { useCallback } from "react";

import {
  getWaflChangeFeedbackMessage,
  useWaflToastOperation,
  type WaflChangeFeedbackStatus,
  type WaflChangeTarget,
} from "@/components/common/ui";

export function useMaterialOrderFeedback() {
  const {
    operation,
    showOperationToast,
    clearOperationToast,
  } = useWaflToastOperation("material-order-operation");

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

  return {
    operation,
    showOperationToast,
    clearOperationToast,
    showChangeFeedback,
  };
}

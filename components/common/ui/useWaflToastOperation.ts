"use client";

import { useCallback, useState } from "react";

import type { WaflToastTone } from "./WaflToast";

export type WaflToastOperationState = {
  id: string;
  message: string;
  tone: WaflToastTone;
  revision: number;
};

export function useWaflToastOperation(defaultOperationId: string) {
  const [operation, setOperation] = useState<WaflToastOperationState | null>(null);

  const showOperationToast = useCallback(
    (message: string, tone: WaflToastTone, operationId = defaultOperationId) => {
      setOperation((current) => ({
        id: operationId,
        message,
        tone,
        revision: (current?.revision ?? 0) + 1,
      }));
    },
    [defaultOperationId],
  );

  const clearOperationToast = useCallback(() => {
    setOperation(null);
  }, []);

  return {
    operation,
    showOperationToast,
    clearOperationToast,
  };
}

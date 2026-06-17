"use client";

import { useCallback, useRef, useState } from "react";

import { useWaflToastOperation, type WaflToastOperationState } from "./useWaflToastOperation";

export type WaflMutationMessages = {
  loading: string;
  success: string;
  error: string;
};

export type WaflMutationOptions<T> = {
  lockKey: string;
  operationId: string;
  messages: WaflMutationMessages;
  mutation: () => T | Promise<T>;
  rollback?: () => void | Promise<void>;
  getErrorMessage?: (error: unknown) => string | undefined;
};

export type WaflMutationRunner = {
  operation: WaflToastOperationState | null;
  isLocked: boolean;
  isLockActive: (lockKey: string) => boolean;
  showOperationToast: (message: string, tone: import("./WaflToast").WaflToastTone, operationId?: string) => void;
  clearOperationToast: () => void;
  runMutation: <T>(options: WaflMutationOptions<T>) => Promise<T | undefined>;
};

export function useWaflMutation(defaultOperationId: string): WaflMutationRunner {
  const { operation, showOperationToast, clearOperationToast } =
    useWaflToastOperation(defaultOperationId);
  const activeLocksRef = useRef(new Set<string>());
  const [lockRevision, setLockRevision] = useState(0);

  const setLockActive = useCallback((lockKey: string, active: boolean) => {
    const locks = activeLocksRef.current;
    const changed = active ? !locks.has(lockKey) : locks.has(lockKey);
    if (!changed) return;

    if (active) locks.add(lockKey);
    else locks.delete(lockKey);
    setLockRevision((current) => current + 1);
  }, []);

  const isLockActive = useCallback(
    (lockKey: string) => {
      void lockRevision;
      return activeLocksRef.current.has(lockKey);
    },
    [lockRevision],
  );

  const runMutation = useCallback(
    async <T,>(options: WaflMutationOptions<T>): Promise<T | undefined> => {
      if (activeLocksRef.current.has(options.lockKey)) return undefined;

      setLockActive(options.lockKey, true);
      showOperationToast(options.messages.loading, "loading", options.operationId);

      try {
        const result = await Promise.resolve(options.mutation());
        showOperationToast(options.messages.success, "success", options.operationId);
        return result;
      } catch (error) {
        try {
          await Promise.resolve(options.rollback?.());
        } catch {
          // The original mutation error remains the source of truth.
        }

        const errorMessage =
          options.getErrorMessage?.(error) ??
          (error instanceof Error && error.message.trim()
            ? error.message
            : options.messages.error);
        showOperationToast(errorMessage, "danger", options.operationId);
        throw error;
      } finally {
        setLockActive(options.lockKey, false);
      }
    },
    [setLockActive, showOperationToast],
  );

  return {
    operation,
    isLocked: activeLocksRef.current.size > 0,
    isLockActive,
    showOperationToast,
    clearOperationToast,
    runMutation,
  };
}

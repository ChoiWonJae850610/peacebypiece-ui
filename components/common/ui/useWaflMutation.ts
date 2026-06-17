"use client";

import { useCallback, useRef, useState } from "react";

import {
  normalizeWaflMutationError,
  type WaflMutationError,
} from "@/lib/mutations/waflMutationError";

import { useWaflToastOperation, type WaflToastOperationState } from "./useWaflToastOperation";

export type WaflMutationMessages = {
  loading: string;
  success: string;
  error: string;
};

export type WaflMutationContext = {
  lockKey: string;
  operationId: string;
  sequenceKey: string;
  revision: number;
};

export type WaflMutationOptions<T> = {
  lockKey: string;
  operationId: string;
  messages: WaflMutationMessages;
  mutation: (context: WaflMutationContext) => T | Promise<T>;
  sequenceKey?: string;
  onSuccess?: (result: T, context: WaflMutationContext) => void | Promise<void>;
  rollback?: (error: WaflMutationError, context: WaflMutationContext) => void | Promise<void>;
  onError?: (error: WaflMutationError, context: WaflMutationContext) => void | Promise<void>;
  getErrorMessage?: (error: unknown) => string | undefined;
};

export type WaflMutationRunner = {
  operation: WaflToastOperationState | null;
  isLocked: boolean;
  isLockActive: (lockKey: string) => boolean;
  isLatestRevision: (sequenceKey: string, revision: number) => boolean;
  showOperationToast: (message: string, tone: import("./WaflToast").WaflToastTone, operationId?: string) => void;
  clearOperationToast: () => void;
  runMutation: <T>(options: WaflMutationOptions<T>) => Promise<T | undefined>;
};

export function useWaflMutation(defaultOperationId: string): WaflMutationRunner {
  const { operation, showOperationToast, clearOperationToast } =
    useWaflToastOperation(defaultOperationId);
  const activeLocksRef = useRef(new Set<string>());
  const sequenceRevisionRef = useRef(new Map<string, number>());
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

  const isLatestRevision = useCallback(
    (sequenceKey: string, revision: number) =>
      sequenceRevisionRef.current.get(sequenceKey) === revision,
    [],
  );

  const runMutation = useCallback(
    async <T,>(options: WaflMutationOptions<T>): Promise<T | undefined> => {
      if (activeLocksRef.current.has(options.lockKey)) return undefined;

      const sequenceKey = options.sequenceKey ?? options.lockKey;
      const revision = (sequenceRevisionRef.current.get(sequenceKey) ?? 0) + 1;
      sequenceRevisionRef.current.set(sequenceKey, revision);
      const context: WaflMutationContext = {
        lockKey: options.lockKey,
        operationId: options.operationId,
        sequenceKey,
        revision,
      };

      setLockActive(options.lockKey, true);
      showOperationToast(options.messages.loading, "loading", options.operationId);

      try {
        const result = await Promise.resolve(options.mutation(context));
        if (!isLatestRevision(sequenceKey, revision)) return undefined;

        await Promise.resolve(options.onSuccess?.(result, context));
        showOperationToast(options.messages.success, "success", options.operationId);
        return result;
      } catch (error) {
        const customMessage = options.getErrorMessage?.(error);
        const normalizedError = normalizeWaflMutationError(
          error,
          customMessage ?? options.messages.error,
        );
        if (customMessage) normalizedError.message = customMessage;

        try {
          await Promise.resolve(options.rollback?.(normalizedError, context));
        } catch {
          // The original mutation error remains the source of truth.
        }

        try {
          await Promise.resolve(options.onError?.(normalizedError, context));
        } catch {
          // Error observers must not replace the mutation failure.
        }

        showOperationToast(normalizedError.message, "danger", options.operationId);
        throw error;
      } finally {
        setLockActive(options.lockKey, false);
      }
    },
    [isLatestRevision, setLockActive, showOperationToast],
  );

  return {
    operation,
    isLocked: activeLocksRef.current.size > 0,
    isLockActive,
    isLatestRevision,
    showOperationToast,
    clearOperationToast,
    runMutation,
  };
}

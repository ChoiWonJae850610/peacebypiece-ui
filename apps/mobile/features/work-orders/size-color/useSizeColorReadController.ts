import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";

import {
  EMPTY_SIZE_COLOR_STATE,
  isSizeColorBundleEmpty,
  promoteSizeColorCacheProjection,
  putBoundedSizeColorEntry,
  type SizeColorCacheEntry,
} from "@/features/work-orders/size-color/sizeColorCache";
import {
  isSizeColorResponseCommitAllowed,
  nextSizeColorSessionGeneration,
  readConsistentSizeColorBundle,
  shouldStartSizeColorRequest,
  SizeColorReadConflictError,
  sizeColorRequestKey,
  type SizeColorRequestAction,
} from "@/features/work-orders/size-color/sizeColorQueryPolicy";
import { workOrderQueryController } from "@/features/work-orders/workOrderQueryController";
import { MobileApiError } from "@/domain/mobileContract";
import type { WorkOrderSizeColorBundle } from "@/domain/mobileContract";

export type SizeColorReadBoundary = {
  readonly identity: string;
  readonly state: SizeColorCacheEntry;
  readonly onOpen: () => void;
  readonly onRetry: () => void;
};

type ActiveIdentity = {
  readonly workOrderId: string | null;
  readonly entityVersion: number | null;
};

type ControllerInput = ActiveIdentity & {
  readonly selectedWorkOrderId: MutableRefObject<string | null>;
  readonly onAuthenticationError: (error: MobileApiError) => void;
};

export function useSizeColorReadController(input: ControllerInput) {
  const {
    workOrderId,
    entityVersion,
    selectedWorkOrderId,
    onAuthenticationError,
  } = input;
  const [cache, setCache] = useState<Readonly<Record<string, SizeColorCacheEntry>>>({});
  const cacheRef = useRef<Readonly<Record<string, SizeColorCacheEntry>>>({});
  const requests = useRef(new Map<string, number>());
  const requestSequence = useRef(0);
  const sessionGeneration = useRef(0);
  const openedWorkOrderId = useRef<string | null>(null);
  const activeIdentity = useRef<ActiveIdentity>({
    workOrderId,
    entityVersion,
  });

  useEffect(() => {
    activeIdentity.current = { workOrderId, entityVersion };
  }, [entityVersion, workOrderId]);

  const updateCache = useCallback((
    updater: (current: Readonly<Record<string, SizeColorCacheEntry>>) => Readonly<Record<string, SizeColorCacheEntry>>,
  ) => {
    const next = updater(cacheRef.current);
    cacheRef.current = next;
    setCache(next);
  }, []);

  const resetSession = useCallback(() => {
    sessionGeneration.current = nextSizeColorSessionGeneration(sessionGeneration.current);
    requests.current.clear();
    cacheRef.current = {};
    openedWorkOrderId.current = null;
    setCache({});
  }, []);

  const load = useCallback(async (
    workOrderId: string,
    entityVersion: number,
    action: SizeColorRequestAction,
  ) => {
    const cacheKey = sizeColorRequestKey(workOrderId, entityVersion);
    const existing = cacheRef.current[cacheKey] ?? EMPTY_SIZE_COLOR_STATE;
    if (!shouldStartSizeColorRequest(action, existing.status, requests.current.has(cacheKey))) return;

    const requestToken = ++requestSequence.current;
    const request = {
      workOrderId,
      entityVersion,
      cacheKey,
      requestToken,
      sessionGeneration: sessionGeneration.current,
    };
    requests.current.set(cacheKey, requestToken);
    updateCache((current) => putBoundedSizeColorEntry(current, cacheKey, {
      status: action === "retry" ? "retrying" : action === "refresh" ? "refreshing" : "loading",
      bundle: existing.bundle,
      errorMessage: null,
      touchedAt: Date.now(),
    }));

    const canCommit = () => isSizeColorResponseCommitAllowed(request, {
      selectedWorkOrderId: selectedWorkOrderId.current,
      selectedEntityVersion: activeIdentity.current.entityVersion,
      activeRequestToken: requests.current.get(cacheKey),
      sessionGeneration: sessionGeneration.current,
    });

    try {
      const bundle = await readConsistentSizeColorBundle({
        workOrderId,
        expectedEntityVersion: entityVersion,
        readMatrix: () => workOrderQueryController.sizeColor(workOrderId),
        readSpecifications: () => workOrderQueryController.sizeSpec(workOrderId),
      });
      if (!canCommit()) return;
      updateCache((current) => putBoundedSizeColorEntry(current, cacheKey, {
        status: isSizeColorBundleEmpty(bundle) ? "empty" : "loaded",
        bundle,
        errorMessage: null,
        touchedAt: Date.now(),
      }));
    } catch (error) {
      if (!canCommit()) return;
      if (error instanceof MobileApiError && (error.code === "AUTH_REQUIRED" || error.status === 401)) {
        onAuthenticationError(error);
        return;
      }
      const message = error instanceof SizeColorReadConflictError
        ? "사이즈·색상과 완성 스펙 버전이 다릅니다. 다시 시도해 주세요."
        : error instanceof MobileApiError
          ? error.message
          : "사이즈·색상을 불러오지 못했습니다.";
      updateCache((current) => putBoundedSizeColorEntry(current, cacheKey, {
        status: "error",
        bundle: existing.bundle,
        errorMessage: message,
        touchedAt: Date.now(),
      }));
    } finally {
      if (requests.current.get(cacheKey) === requestToken) requests.current.delete(cacheKey);
    }
  }, [onAuthenticationError, selectedWorkOrderId, updateCache]);

  const onOpen = useCallback(() => {
    const current = activeIdentity.current;
    if (current.workOrderId !== null && current.entityVersion !== null) {
      openedWorkOrderId.current = current.workOrderId;
      void load(current.workOrderId, current.entityVersion, "initial");
    }
  }, [load]);

  const onRetry = useCallback(() => {
    const current = activeIdentity.current;
    if (current.workOrderId !== null && current.entityVersion !== null) {
      void load(current.workOrderId, current.entityVersion, "retry");
    }
  }, [load]);

  const reconcileMutation = useCallback((
    updater: (bundle: WorkOrderSizeColorBundle) => WorkOrderSizeColorBundle,
    nextVersion: number,
  ) => {
    const current = activeIdentity.current;
    const currentWorkOrderId = current.workOrderId;
    const currentEntityVersion = current.entityVersion;
    if (currentWorkOrderId === null || currentEntityVersion === null) return;
    updateCache((cache) => promoteSizeColorCacheProjection(cache, {
      workOrderId: currentWorkOrderId,
      currentVersion: currentEntityVersion,
      nextVersion,
      updater,
      touchedAt: Date.now(),
    }));
  }, [updateCache]);

  const promoteCurrentProjectionVersion = useCallback((nextVersion: number) => {
    reconcileMutation((bundle) => bundle, nextVersion);
  }, [reconcileMutation]);

  const refreshWithData = useCallback(() => {
    const current = activeIdentity.current;
    if (current.workOrderId !== null && current.entityVersion !== null) {
      void load(current.workOrderId, current.entityVersion, "refresh");
    }
  }, [load]);

  useEffect(() => {
    if (openedWorkOrderId.current !== workOrderId || workOrderId === null || entityVersion === null) return;
    void load(workOrderId, entityVersion, "initial");
  }, [entityVersion, load, workOrderId]);

  const state = workOrderId !== null && entityVersion !== null
    ? cache[sizeColorRequestKey(workOrderId, entityVersion)] ?? EMPTY_SIZE_COLOR_STATE
    : EMPTY_SIZE_COLOR_STATE;
  const identity = workOrderId !== null && entityVersion !== null
    ? sizeColorRequestKey(workOrderId, entityVersion)
    : "size-color:unavailable";

  const boundary = useMemo<SizeColorReadBoundary>(() => ({
    identity,
    state,
    onOpen,
    onRetry,
  }), [identity, onOpen, onRetry, state]);

  return { boundary, resetSession, reconcileMutation, promoteCurrentProjectionVersion, refreshWithData };
}

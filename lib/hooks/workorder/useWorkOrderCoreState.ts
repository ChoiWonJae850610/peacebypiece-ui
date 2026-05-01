"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkorderRepository } from "@/lib/repositories/WorkorderRepositoryProvider";
import { createRepositoryError, type WorkOrderRepositoryError } from "@/lib/repositories/repositoryErrors";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";
import type { AsyncOperationStatus } from "./useWorkOrderActionTypes";
import { createStabilizedWorkOrdersSetter, stabilizeWorkOrders } from "@/lib/workorder/reorder/state";
import { normalizeWorkOrderDataList } from "@/lib/workorder/normalization";
import { hasWorkOrderDraftChanges } from "@/lib/workorder/draftState";

const createFallbackWorkOrder = (): WorkOrder => ({
  id: "",
  title: "",
  category1: "",
  category2: "",
  category3: "",
  season: "",
  priority: "",
  vendor: "",
  manager: "",
  managerId: null,
  createdById: "",
  createdByRole: "admin",
  dueDate: "",
  quantity: 0,
  laborCost: 0,
  lossCost: 0,
  orderEntries: [],
  inventoryQuantity: 0,
  inventoryStatus: "unchecked",
  memo: "",
  materials: [],
  outsourcing: [],
  attachments: [],
  memoThreads: [],
  workflowState: "draft",
  lastSavedAt: "",
  factoryOrderRequest: null,
});

type UseWorkOrderCoreStateOptions = {
  initialWorkOrderId?: string | null;
};

function resolveInitialSelectedId(input: {
  requestedId: string | null;
  fallbackId: string;
  workOrders: WorkOrder[];
}): string {
  if (input.requestedId && input.workOrders.some((item) => item.id === input.requestedId)) return input.requestedId;
  return input.fallbackId;
}

export function useWorkOrderCoreState(options: UseWorkOrderCoreStateOptions = {}) {
  const repository = useWorkorderRepository();
  const initialUsers = useMemo(() => repository.getInitialUsers(), [repository]);
  const initialWorkOrders = useMemo(() => repository.getInitialWorkOrders(), [repository]);
  const initialHistoryLogs = useMemo(() => repository.getInitialHistoryLogs(), [repository]);
  const repositoryDefaultSelectedId = useMemo(() => repository.getDefaultSelectedId(), [repository]);
  const initialCurrentUserId = useMemo(() => repository.getDefaultCurrentUserId(), [repository]);
  const initialPermissionTargetUserId = useMemo(() => repository.getDefaultPermissionTargetId(), [repository]);

  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(initialPermissionTargetUserId);
  const normalizedInitialWorkOrders = useMemo(() => stabilizeWorkOrders(normalizeWorkOrderDataList(initialWorkOrders)), [initialWorkOrders]);
  const [workOrders, setWorkOrdersState] = useState<WorkOrder[]>(normalizedInitialWorkOrders);
  const [persistedWorkOrders, setPersistedWorkOrders] = useState<WorkOrder[]>(normalizedInitialWorkOrders);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(initialHistoryLogs);
  const [selectedId, setSelectedId] = useState(() =>
    resolveInitialSelectedId({ requestedId: options.initialWorkOrderId ?? null, fallbackId: repositoryDefaultSelectedId, workOrders: normalizedInitialWorkOrders }),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [repositoryStatus, setRepositoryStatus] = useState<AsyncOperationStatus>("loading");
  const [repositoryError, setRepositoryError] = useState<WorkOrderRepositoryError | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initialWorkOrders.find((item) => item.id === selectedId)?.lastSavedAt ?? initialWorkOrders[0]?.lastSavedAt ?? null,
  );

  useEffect(() => {
    let cancelled = false;

    setRepositoryStatus("loading");
    setRepositoryError(null);

    repository
      .loadWorkspaceStateAsync()
      .then((loadedState) => {
        if (cancelled) return;
        const nextState = loadedState ?? repository.createInitialState();
        setUsers(nextState.users);
        setCurrentUserId(nextState.currentUserId);
        setPermissionTargetUserId(nextState.permissionTargetUserId);
        const normalizedLoadedWorkOrders = stabilizeWorkOrders(normalizeWorkOrderDataList(nextState.workOrders));
        setWorkOrdersState(normalizedLoadedWorkOrders);
        setPersistedWorkOrders(normalizedLoadedWorkOrders);
        setHistoryLogs(nextState.historyLogs);
        const nextSelectedId = resolveInitialSelectedId({
          requestedId: options.initialWorkOrderId ?? null,
          fallbackId: nextState.selectedId,
          workOrders: normalizedLoadedWorkOrders,
        });
        setSelectedId(nextSelectedId);
        const nextSelected = normalizedLoadedWorkOrders.find((item) => item.id === nextSelectedId) ?? normalizedLoadedWorkOrders[0];
        setLastSavedAt(nextSelected?.lastSavedAt ?? null);
        setRepositoryStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setRepositoryError(createRepositoryError("initialize", error, "Failed to load workorder repository state."));
        setRepositoryStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [options.initialWorkOrderId, repository]);

  useEffect(() => {
    if (repositoryStatus !== "ready") return;

    repository
      .saveWorkspaceSessionAsync({
        selectedId,
        currentUserId,
        permissionTargetUserId,
      })
      .catch((error) => {
        setRepositoryError(createRepositoryError("persist", error, "Failed to persist workorder workspace session."));
        setRepositoryStatus("error");
      });
  }, [currentUserId, permissionTargetUserId, repository, repositoryStatus, selectedId]);

  const setWorkOrders = useCallback(createStabilizedWorkOrdersSetter(setWorkOrdersState), []);

  const selectedWorkOrder = useMemo(
    () => (selectedId ? workOrders.find((item) => item.id === selectedId) : null) ?? createFallbackWorkOrder(),
    [workOrders, selectedId],
  );

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? users[0],
    [users, currentUserId],
  );

  useEffect(() => {
    const currentSelectedWorkOrder = selectedId ? workOrders.find((item) => item.id === selectedId) ?? null : null;
    const persistedSelectedWorkOrder = selectedId ? persistedWorkOrders.find((item) => item.id === selectedId) ?? null : null;
    const isDirty = hasWorkOrderDraftChanges(currentSelectedWorkOrder, persistedSelectedWorkOrder);

    setSaveStatus((previous) => {
      if (previous === "saving") return previous;
      return isDirty ? "dirty" : "saved";
    });
    setLastSavedAt(persistedSelectedWorkOrder?.lastSavedAt ?? currentSelectedWorkOrder?.lastSavedAt ?? null);
  }, [persistedWorkOrders, selectedId, workOrders]);

  const permissionTargetUser = useMemo(
    () => users.find((user) => user.id === permissionTargetUserId) ?? users[0],
    [users, permissionTargetUserId],
  );

  return {
    users,
    setUsers,
    currentUserId,
    setCurrentUserId,
    permissionTargetUserId,
    setPermissionTargetUserId,
    permissionTargetUser,
    workOrders,
    setWorkOrders,
    persistedWorkOrders,
    setPersistedWorkOrders,
    historyLogs,
    setHistoryLogs,
    selectedId,
    setSelectedId,
    selectedWorkOrder,
    searchQuery,
    setSearchQuery,
    saveStatus,
    setSaveStatus,
    lastSavedAt,
    setLastSavedAt,
    currentUser,
    repositoryStatus,
    repositoryError,
  };
}

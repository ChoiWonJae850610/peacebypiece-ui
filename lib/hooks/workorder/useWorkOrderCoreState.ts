"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWorkorderRepository } from "@/lib/repositories/WorkorderRepositoryProvider";
import { createRepositoryError, type WorkOrderRepositoryError } from "@/lib/repositories/repositoryErrors";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";
import type { AsyncOperationStatus } from "./useWorkOrderActionTypes";
import { createStabilizedWorkOrdersSetter, stabilizeWorkOrders } from "@/lib/workorder/reorder/state";
import { normalizeWorkOrderDataList } from "@/lib/workorder/normalization";

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

export function useWorkOrderCoreState() {
  const repository = useWorkorderRepository();
  const initialUsers = useMemo(() => repository.getInitialUsers(), [repository]);
  const initialWorkOrders = useMemo(() => repository.getInitialWorkOrders(), [repository]);
  const initialHistoryLogs = useMemo(() => repository.getInitialHistoryLogs(), [repository]);
  const initialSelectedId = useMemo(() => repository.getDefaultSelectedId(), [repository]);
  const initialCurrentUserId = useMemo(() => repository.getDefaultCurrentUserId(), [repository]);
  const initialPermissionTargetUserId = useMemo(() => repository.getDefaultPermissionTargetId(), [repository]);

  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [currentUserId, setCurrentUserId] = useState(initialCurrentUserId);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(initialPermissionTargetUserId);
  const [workOrders, setWorkOrdersState] = useState<WorkOrder[]>(stabilizeWorkOrders(normalizeWorkOrderDataList(initialWorkOrders)));
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(initialHistoryLogs);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [searchQuery, setSearchQuery] = useState("");
  const [repositoryStatus, setRepositoryStatus] = useState<AsyncOperationStatus>("loading");
  const [repositoryError, setRepositoryError] = useState<WorkOrderRepositoryError | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initialWorkOrders.find((item) => item.id === initialSelectedId)?.lastSavedAt ?? initialWorkOrders[0]?.lastSavedAt ?? null,
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
        setWorkOrdersState(stabilizeWorkOrders(normalizeWorkOrderDataList(nextState.workOrders)));
        setHistoryLogs(nextState.historyLogs);
        setSelectedId(nextState.selectedId);
        const nextSelected = nextState.workOrders.find((item) => item.id === nextState.selectedId) ?? nextState.workOrders[0];
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
  }, [repository]);

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
    () => workOrders.find((item) => item.id === selectedId) ?? workOrders[0] ?? createFallbackWorkOrder(),
    [workOrders, selectedId],
  );

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? users[0],
    [users, currentUserId],
  );

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

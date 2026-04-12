"use client";

import { useEffect, useMemo, useState } from "react";
import { getMockWorkorderRepository } from "@/lib/repositories/mockWorkorderRepository";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";
import type { AsyncOperationStatus } from "./useWorkOrderActionTypes";

export function useWorkOrderCoreState() {
  const repository = getMockWorkorderRepository();
  const initialState = repository.createInitialState();
  const initialWorkOrders = initialState.workOrders;
  const initialSelectedId = initialState.selectedId;

  const [users, setUsers] = useState<UserProfile[]>(() => initialState.users);
  const [currentUserId, setCurrentUserId] = useState(() => initialState.currentUserId);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(() => initialState.permissionTargetUserId);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => initialState.workOrders);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(() => initialState.historyLogs);
  const [selectedId, setSelectedId] = useState(() => initialState.selectedId);
  const [searchQuery, setSearchQuery] = useState("");
  const [repositoryStatus, setRepositoryStatus] = useState<AsyncOperationStatus>("loading");
  const [repositoryError, setRepositoryError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initialWorkOrders.find((item) => item.id === initialSelectedId)?.lastSavedAt ?? initialWorkOrders[0]?.lastSavedAt ?? null,
  );

  useEffect(() => {
    let cancelled = false;

    setRepositoryStatus("loading");
    setRepositoryError(null);

    repository
      .createInitialStateAsync()
      .then((nextState) => {
        if (cancelled) return;
        setUsers(nextState.users);
        setCurrentUserId(nextState.currentUserId);
        setPermissionTargetUserId(nextState.permissionTargetUserId);
        setWorkOrders(nextState.workOrders);
        setHistoryLogs(nextState.historyLogs);
        setSelectedId(nextState.selectedId);
        const nextSelected = nextState.workOrders.find((item) => item.id === nextState.selectedId) ?? nextState.workOrders[0];
        setLastSavedAt(nextSelected?.lastSavedAt ?? null);
        setRepositoryStatus("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setRepositoryError(error instanceof Error ? error.message : "Failed to load workorder repository state.");
        setRepositoryStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [repository]);

  useEffect(() => {
    if (repositoryStatus !== "ready") return;

    repository.persistStateAsync({
      users,
      workOrders,
      historyLogs,
      selectedId,
      currentUserId,
      permissionTargetUserId,
    }).catch((error) => {
      setRepositoryError(error instanceof Error ? error.message : "Failed to persist workorder repository state.");
      setRepositoryStatus("error");
    });
  }, [currentUserId, historyLogs, permissionTargetUserId, repository, repositoryStatus, selectedId, users, workOrders]);

  const selectedWorkOrder = useMemo(
    () => workOrders.find((item) => item.id === selectedId) ?? workOrders[0],
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

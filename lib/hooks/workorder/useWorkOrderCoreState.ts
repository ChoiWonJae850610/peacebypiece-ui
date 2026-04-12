"use client";

import { useMemo, useState } from "react";
import { getMockWorkorderRepository } from "@/lib/repositories/mockWorkorderRepository";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export function useWorkOrderCoreState() {
  const repository = getMockWorkorderRepository();
  const initialWorkOrders = repository.getInitialWorkOrders();
  const initialSelectedId = repository.getDefaultSelectedId();

  const [users, setUsers] = useState<UserProfile[]>(() => repository.getInitialUsers());
  const [currentUserId, setCurrentUserId] = useState(() => repository.getDefaultCurrentUserId());
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(() => repository.getDefaultPermissionTargetId());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => repository.getInitialWorkOrders());
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(() => repository.getInitialHistoryLogs());
  const [selectedId, setSelectedId] = useState(() => repository.getDefaultSelectedId());
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initialWorkOrders.find((item) => item.id === initialSelectedId)?.lastSavedAt ?? initialWorkOrders[0]?.lastSavedAt ?? null,
  );

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
  };
}

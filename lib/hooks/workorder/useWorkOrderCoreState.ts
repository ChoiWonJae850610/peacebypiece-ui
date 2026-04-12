"use client";

import { useMemo, useState } from "react";
import {
  getDefaultCurrentUserId,
  getDefaultPermissionTargetId,
  getDefaultSelectedId,
  getInitialHistoryLogs,
  getInitialUsers,
  getMockWorkOrders,
} from "@/lib/data/workorderMockData";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export function useWorkOrderCoreState() {
  const initialWorkOrders = getMockWorkOrders();
  const initialSelectedId = getDefaultSelectedId();

  const [users, setUsers] = useState<UserProfile[]>(() => getInitialUsers());
  const [currentUserId, setCurrentUserId] = useState(() => getDefaultCurrentUserId());
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(() => getDefaultPermissionTargetId());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => getMockWorkOrders());
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(() => getInitialHistoryLogs());
  const [selectedId, setSelectedId] = useState(() => getDefaultSelectedId());
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

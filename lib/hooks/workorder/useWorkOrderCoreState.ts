"use client";

import { useMemo, useState } from "react";
import { DEFAULT_SELECTED_WORK_ORDER_ID, MOCK_HISTORY_LOGS, MOCK_WORK_ORDERS } from "@/lib/data/mock/workorders";
import { DEFAULT_CURRENT_USER_ID, DEFAULT_PERMISSION_TARGET_ID, MOCK_USERS } from "@/lib/data/mock/users";
import type { HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export function useWorkOrderCoreState() {
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_CURRENT_USER_ID);
  const [permissionTargetUserId, setPermissionTargetUserId] = useState(DEFAULT_PERMISSION_TARGET_ID);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(MOCK_HISTORY_LOGS);
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_WORK_ORDER_ID);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "dirty" | "saving">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    MOCK_WORK_ORDERS.find((item) => item.id === DEFAULT_SELECTED_WORK_ORDER_ID)?.lastSavedAt ??
      MOCK_WORK_ORDERS[0]?.lastSavedAt ??
      null,
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

"use client";

import { useMemo, useState } from "react";
import { filterHistoryLogs } from "@/lib/workorder/history/filters";
import { toInventoryLogs } from "@/lib/workorder/history/inventory";
import { getReorderGroupWorkOrders } from "@/lib/workorder/reorder/inventory";
import type { WorkOrder } from "@/types/workorder";
import { normalizeRoles } from "@/lib/constants/roles";
import type { HistoryLog, UserProfile } from "@/types/workorder";
import type { HistoryFilter } from "@/types/workflow";

export function useWorkOrderHistory({
  historyLogs,
  selectedWorkOrderId,
  currentUser,
  isAdmin,
  workOrders,
}: {
  historyLogs: HistoryLog[];
  selectedWorkOrderId: string;
  currentUser: UserProfile;
  isAdmin: boolean;
  workOrders: WorkOrder[];
}) {
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  const currentRoles = normalizeRoles(currentUser.roles, currentUser.role);

  const scopedHistoryLogs = useMemo(() => {
    const selectedWorkOrder = workOrders.find((item) => item.id === selectedWorkOrderId);
    if (!selectedWorkOrder) return historyLogs.filter((item) => item.workOrderId === selectedWorkOrderId);

    const groupedIds = new Set(getReorderGroupWorkOrders(workOrders, selectedWorkOrder).map((item) => item.id));
    return historyLogs.filter((item) => groupedIds.has(item.workOrderId));
  }, [historyLogs, selectedWorkOrderId, workOrders]);

  const filteredHistoryLogs = useMemo(
    () => filterHistoryLogs(scopedHistoryLogs, isAdmin, historyFilter, currentRoles),
    [scopedHistoryLogs, isAdmin, historyFilter, currentRoles],
  );

  const inventoryLogs = useMemo(() => toInventoryLogs(scopedHistoryLogs), [scopedHistoryLogs]);

  return {
    historyFilter,
    setHistoryFilter,
    filteredHistoryLogs,
    inventoryLogs,
  };
}

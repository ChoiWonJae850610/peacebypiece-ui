"use client";

import { useMemo, useState } from "react";
import { filterHistoryLogs } from "@/lib/workorder/history/filters";
import { toInventoryLogs } from "@/lib/workorder/history/inventory";
import { getReorderGroupWorkOrders } from "@/lib/workorder/reorder/inventory";
import type { WorkOrder } from "@/types/workorder";
import { normalizeRoles } from "@/lib/constants/roles";
import type { HistoryLog, UserProfile } from "@/types/workorder";
import type { HistoryFilter, NotificationSettingKey, NotificationSettings } from "@/types/workflow";

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
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    created: false,
    updated: false,
    status_changed: true,
    materials_changed: false,
    outsourcing_changed: false,
    stock_changed: true,
    comment_added: true,
  });

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

  const handleToggleNotificationSetting = (key: NotificationSettingKey) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    historyFilter,
    setHistoryFilter,
    notificationSettings,
    handleToggleNotificationSetting,
    filteredHistoryLogs,
    inventoryLogs,
  };
}

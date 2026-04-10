"use client";

import { useMemo, useState } from "react";
import { filterHistoryLogs, toInventoryLogs } from "@/lib/workorder/history";
import { normalizeRoles } from "@/lib/constants/roles";
import type { HistoryLog, UserProfile } from "@/types/workorder";
import type { HistoryFilter, NotificationSettingKey, NotificationSettings } from "@/types/workflow";

export function useWorkOrderHistory({
  historyLogs,
  selectedWorkOrderId,
  currentUser,
  isAdmin,
}: {
  historyLogs: HistoryLog[];
  selectedWorkOrderId: string;
  currentUser: UserProfile;
  isAdmin: boolean;
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

  const scopedHistoryLogs = useMemo(
    () => historyLogs.filter((item) => item.workOrderId === selectedWorkOrderId),
    [historyLogs, selectedWorkOrderId],
  );

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

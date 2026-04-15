"use client";

import { useEffect, useMemo, useState } from "react";
import { isAdminRole, normalizeRoles } from "@/lib/constants/roles";
import { filterHistoryLogs } from "@/lib/workorder/history/filters";
import { useWorkOrderCoreState } from "@/lib/hooks/workorder/useWorkOrderCoreState";
import { loadNotificationSettings, persistNotificationSettings } from "@/lib/admin/notificationSettingsPersistence";
import type { HistoryFilter, NotificationSettingKey, NotificationSettings } from "@/types/workflow";

export type AdminWorkspaceModalKey = "history" | "notification" | null;

export function useAdminWorkspaceTools() {
  const coreState = useWorkOrderCoreState();
  const [openModal, setOpenModal] = useState<AdminWorkspaceModalKey>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(loadNotificationSettings);

  const adminViewer = useMemo(
    () => coreState.users.find((user) => isAdminRole(user)) ?? coreState.currentUser,
    [coreState.currentUser, coreState.users],
  );

  const currentRoles = useMemo(
    () => normalizeRoles(adminViewer.roles, adminViewer.role),
    [adminViewer.role, adminViewer.roles],
  );

  const adminHistoryLogs = useMemo(
    () => filterHistoryLogs(coreState.historyLogs, true, historyFilter, currentRoles),
    [coreState.historyLogs, historyFilter, currentRoles],
  );

  useEffect(() => {
    persistNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  const handleToggleNotificationSetting = (key: NotificationSettingKey) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    historyLogs: adminHistoryLogs,
    historyFilter,
    setHistoryFilter,
    notificationSettings,
    handleToggleNotificationSetting,
    openModal,
    openHistoryModal: () => setOpenModal("history"),
    openNotificationModal: () => setOpenModal("notification"),
    closeModal: () => setOpenModal(null),
  };
}

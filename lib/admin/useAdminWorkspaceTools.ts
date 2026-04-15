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
  const [activeModal, setActiveModal] = useState<AdminWorkspaceModalKey>(null);
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

  const historyLogs = useMemo(
    () => filterHistoryLogs(coreState.historyLogs, true, historyFilter, currentRoles),
    [coreState.historyLogs, historyFilter, currentRoles],
  );

  useEffect(() => {
    persistNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  const openModal = (modal: Exclude<AdminWorkspaceModalKey, null>) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleToggleNotificationSetting = (key: NotificationSettingKey) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return {
    activeModal,
    historyLogs,
    historyFilter,
    setHistoryFilter,
    notificationSettings,
    handleToggleNotificationSetting,
    openModal,
    closeModal,
    openHistoryModal: () => openModal("history"),
    openNotificationModal: () => openModal("notification"),
  };
}

"use client";

import { useEffect, useState } from "react";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/admin/notification/defaults";
import { loadNotificationSettings, persistNotificationSettings } from "@/lib/admin/notificationSettingsPersistence";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";

export type AdminWorkspaceModalKey = "notification" | null;

export function useAdminWorkspaceTools() {
  const [activeModal, setActiveModal] = useState<AdminWorkspaceModalKey>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  useEffect(() => {
    setNotificationSettings(loadNotificationSettings());
    setHasLoadedSettings(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings) return;
    persistNotificationSettings(notificationSettings);
  }, [hasLoadedSettings, notificationSettings]);

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
    notificationSettings,
    handleToggleNotificationSetting,
    openModal,
    closeModal,
    openNotificationModal: () => openModal("notification"),
  };
}

"use client";

import { useEffect, useState } from "react";
import { loadNotificationSettings, persistNotificationSettings } from "@/lib/admin/notificationSettingsPersistence";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";

export type AdminWorkspaceModalKey = "notification" | null;

export function useAdminWorkspaceTools() {
  const [activeModal, setActiveModal] = useState<AdminWorkspaceModalKey>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(loadNotificationSettings);

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
    notificationSettings,
    handleToggleNotificationSetting,
    openModal,
    closeModal,
    openNotificationModal: () => openModal("notification"),
  };
}

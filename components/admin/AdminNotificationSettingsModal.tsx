"use client";

import { AdminModal } from "@/components/admin/layout/AdminModal";
import AdminNotificationSettingsSection from "@/components/admin/notification/AdminNotificationSettingsSection";
import { useI18n } from "@/lib/i18n";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";

type AdminNotificationSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
};

export default function AdminNotificationSettingsModal({
  open,
  onClose,
  notificationSettings,
  onToggleNotificationSetting,
}: AdminNotificationSettingsModalProps) {
  const { i18n } = useI18n();
  const notificationModalText = i18n.admin.notificationModal;
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={notificationModalText.title}
      description={notificationModalText.description}
      maxWidthClass="md:max-w-2xl"
    >
        <AdminNotificationSettingsSection
          notificationSettings={notificationSettings}
          onToggleNotificationSetting={onToggleNotificationSetting}
        />
    </AdminModal>
  );
}

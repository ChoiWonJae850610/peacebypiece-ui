"use client";

import { AdminModal, adminModalPrimaryButtonClassName, adminModalSecondaryButtonClassName } from "@/components/admin/layout/AdminModal";
import AdminNotificationSettingsSection from "@/components/admin/notification/AdminNotificationSettingsSection";
import { useI18n } from "@/lib/i18n";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";

type AdminNotificationSettingsModalProps = {
  open: boolean;
  onClose: () => void;
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
  onResetNotificationSettings?: () => void;
  title?: string;
  description?: string;
};

export default function AdminNotificationSettingsModal({
  open,
  onClose,
  notificationSettings,
  onToggleNotificationSetting,
  onResetNotificationSettings,
  title,
  description,
}: AdminNotificationSettingsModalProps) {
  const { i18n } = useI18n();
  const notificationModalText = i18n.admin.notificationModal;
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title || notificationModalText.title}
      description={description ?? notificationModalText.description}
      maxWidthClass="md:max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetNotificationSettings}
            className={adminModalSecondaryButtonClassName}
          >
            기본값 복원
          </button>
          <button type="button" onClick={onClose} className={adminModalPrimaryButtonClassName}>
            저장
          </button>
        </div>
      }
    >
      <AdminNotificationSettingsSection
        notificationSettings={notificationSettings}
        onToggleNotificationSetting={onToggleNotificationSetting}
      />
    </AdminModal>
  );
}

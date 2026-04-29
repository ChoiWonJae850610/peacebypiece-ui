"use client";

import { AdminModal, adminModalPrimaryButtonClassName, adminModalSecondaryButtonClassName } from "@/components/admin/layout/AdminModal";
import AdminNotificationSettingsSection from "@/components/admin/notification/AdminNotificationSettingsSection";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";
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
  const t = useAdminTranslation();
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title || t("notificationModal.title", "알림 이벤트 설정")}
      description={description ?? t("notificationModal.description", "관리자 화면을 벗어나지 않고 알림 이벤트 ON/OFF 상태를 모달에서 관리합니다.")}
      maxWidthClass="md:max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetNotificationSettings}
            className={adminModalSecondaryButtonClassName}
          >
            {t("standards.common.resetDefaults", "기본값 복원")}
          </button>
          <button type="button" onClick={onClose} className={adminModalPrimaryButtonClassName}>
            {t("standards.common.save", "저장")}
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

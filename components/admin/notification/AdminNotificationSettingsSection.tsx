"use client";

import AdminSettingsToggleRow from "@/components/admin/common/AdminSettingsToggleRow";
import { buildAdminNotificationSettingItems } from "@/lib/admin/notification/presentation";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";
import { useAdminTranslation } from "@/lib/i18n/useAdminTranslation";

type AdminNotificationSettingsSectionProps = {
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
};

export default function AdminNotificationSettingsSection({
  notificationSettings,
  onToggleNotificationSetting,
}: AdminNotificationSettingsSectionProps) {
  const t = useAdminTranslation();
  const items = buildAdminNotificationSettingItems(notificationSettings);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="grid gap-2">
        {items.map((item) => (
          <AdminSettingsToggleRow
            key={item.key}
            label={item.label}
            checked={item.checked}
            activeLabel={t("standards.common.active", "사용")}
            inactiveLabel={t("standards.common.inactive", "미사용")}
            className="bg-stone-50/70"
            onChange={() => onToggleNotificationSetting(item.key)}
          />
        ))}
      </div>
    </section>
  );
}

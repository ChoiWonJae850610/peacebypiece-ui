"use client";

import StatusToggle from "@/components/common/StatusToggle";
import { buildAdminNotificationSettingItems } from "@/lib/admin/notification/presentation";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";

type AdminNotificationSettingsSectionProps = {
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
};

export default function AdminNotificationSettingsSection({
  notificationSettings,
  onToggleNotificationSetting,
}: AdminNotificationSettingsSectionProps) {
  const items = buildAdminNotificationSettingItems(notificationSettings);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3 transition hover:border-stone-300 hover:bg-white"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-stone-900">{item.label}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusToggle
                checked={item.checked}
                onChange={() => onToggleNotificationSetting(item.key)}
                srLabel={item.srLabel}
                size="sm"
              />
              <span className="text-xs font-medium text-stone-600">{item.stateLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

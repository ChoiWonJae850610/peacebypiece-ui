"use client";

import StatusToggle from "@/components/common/StatusToggle";
import { buildAdminNotificationSettingItems } from "@/lib/admin/notification/presentation";
import { useI18n } from "@/lib/i18n";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";

type AdminNotificationSettingsSectionProps = {
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
};

export default function AdminNotificationSettingsSection({
  notificationSettings,
  onToggleNotificationSetting,
}: AdminNotificationSettingsSectionProps) {
  const { i18n } = useI18n();
  const notificationI18n = i18n.admin.notificationSection;
  const items = buildAdminNotificationSettingItems(notificationSettings);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-stone-900">{notificationI18n.title}</div>
          <div className="mt-1 text-xs leading-5 text-stone-500">{notificationI18n.description}</div>
        </div>
        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">{notificationI18n.badge}</span>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3 transition hover:border-stone-300 hover:bg-white"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-stone-900">{item.label}</div>
              <div className="mt-1 break-keep text-xs leading-5 text-stone-500">{item.description}</div>
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

"use client";

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
          <div
            key={item.key}
            className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 px-3 py-3 transition hover:border-stone-300 hover:bg-white"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-stone-900">{item.label}</div>
            </div>
            <button
              type="button"
              onClick={() => onToggleNotificationSetting(item.key)}
              className={`min-w-[88px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${item.checked ? "border-emerald-200 bg-emerald-100 text-emerald-800" : "border-stone-900 bg-stone-950 text-white"}`}
            >
              {item.checked ? t("notificationSection.toggleOn", "ON") : t("notificationSection.toggleOff", "OFF")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

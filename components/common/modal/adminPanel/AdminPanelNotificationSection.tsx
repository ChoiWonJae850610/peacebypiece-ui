"use client";

import StatusToggle from "@/components/common/StatusToggle";
import { useI18n } from "@/lib/i18n";
import { NOTIFICATION_SETTING_META } from "@/lib/constants/workflow";
import type { NotificationSettingKey, NotificationSettings } from "@/types/workflow";

type AdminPanelNotificationSectionProps = {
  notificationSettings: NotificationSettings;
  onToggleNotificationSetting: (key: NotificationSettingKey) => void;
};

export default function AdminPanelNotificationSection({
  notificationSettings,
  onToggleNotificationSetting,
}: AdminPanelNotificationSectionProps) {
  const { i18n } = useI18n();
  const ui = i18n.common.ui;

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-3 md:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-stone-900">{ui.modal.adminPanel.notificationTitle}</div>
          <div className="mt-1 text-xs leading-5 text-stone-500">{ui.modal.adminPanel.notificationDescription}</div>
        </div>
        <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-medium text-sky-700">
          {ui.modal.adminPanel.testBadge}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {NOTIFICATION_SETTING_META.map((item) => {
          const checked = notificationSettings[item.key];
          return (
            <div
              key={item.key}
              className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 transition hover:border-stone-300 hover:bg-stone-100"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-stone-900">{item.label}</div>
                <div className="mt-1 break-keep text-xs leading-5 text-stone-500">{item.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusToggle
                  checked={checked}
                  onChange={() => onToggleNotificationSetting(item.key)}
                  srLabel={`${item.label} ${checked ? ui.modal.adminPanel.toggleOn : ui.modal.adminPanel.toggleOff}`}
                  size="sm"
                />
                <span className="text-xs font-medium text-stone-600">
                  {checked ? ui.modal.adminPanel.toggleOn : ui.modal.adminPanel.toggleOff}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { NOTIFICATION_SETTINGS_META } from "@/lib/admin/notification/meta";
import type { NotificationSettingKey, NotificationSettings } from "@/lib/admin/notification/types";
import { getI18n } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n";

const adminNotificationI18n = getI18n(DEFAULT_LOCALE).admin.notificationSection;

type NotificationSettingItemText = {
  label: string;
  description: string;
};

export type AdminNotificationSettingItemViewModel = {
  key: NotificationSettingKey;
  label: string;
  description: string;
  checked: boolean;
  stateLabel: string;
  srLabel: string;
};

function getNotificationItemText(key: NotificationSettingKey): NotificationSettingItemText {
  return adminNotificationI18n.items[key];
}

export function buildAdminNotificationSettingItems(notificationSettings: NotificationSettings): AdminNotificationSettingItemViewModel[] {
  return NOTIFICATION_SETTINGS_META.map(({ key }) => {
    const checked = notificationSettings[key];
    const itemText = getNotificationItemText(key);
    const stateLabel = checked ? adminNotificationI18n.toggleOn : adminNotificationI18n.toggleOff;

    return {
      key,
      label: itemText.label,
      description: itemText.description,
      checked,
      stateLabel,
      srLabel: `${itemText.label} ${stateLabel}`,
    };
  });
}

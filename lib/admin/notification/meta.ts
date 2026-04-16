import { NOTIFICATION_SETTING_KEYS, type NotificationSettingKey } from "@/lib/admin/notification/types";

export type NotificationSettingMeta = {
  key: NotificationSettingKey;
  defaultEnabled: boolean;
};

export const NOTIFICATION_SETTINGS_META: readonly NotificationSettingMeta[] = [
  { key: "created", defaultEnabled: false },
  { key: "updated", defaultEnabled: false },
  { key: "status_changed", defaultEnabled: true },
  { key: "materials_changed", defaultEnabled: false },
  { key: "outsourcing_changed", defaultEnabled: false },
  { key: "stock_changed", defaultEnabled: true },
  { key: "comment_added", defaultEnabled: true },
] as const;

export const NOTIFICATION_SETTING_KEY_SET = new Set<NotificationSettingKey>(NOTIFICATION_SETTING_KEYS);

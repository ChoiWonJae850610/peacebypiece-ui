export const NOTIFICATION_SETTING_KEYS = [
  "created",
  "updated",
  "status_changed",
  "materials_changed",
  "outsourcing_changed",
  "stock_changed",
] as const;

export type NotificationSettingKey = (typeof NOTIFICATION_SETTING_KEYS)[number];
export type NotificationSettings = Record<NotificationSettingKey, boolean>;

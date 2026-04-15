import { loadJsonFromStorage, persistJsonToStorage } from "@/lib/repositories/browserStorage";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/admin/notificationSettings";
import type { NotificationSettings } from "@/types/workflow";

const NOTIFICATION_SETTINGS_STORAGE_KEY = "pbp.admin.notification-settings";
const NOTIFICATION_SETTINGS_LEGACY_KEYS = ["pbp.notification-settings"] as const;

export function loadNotificationSettings(): NotificationSettings {
  return loadJsonFromStorage<NotificationSettings>([
    NOTIFICATION_SETTINGS_STORAGE_KEY,
    ...NOTIFICATION_SETTINGS_LEGACY_KEYS,
  ]) ?? DEFAULT_NOTIFICATION_SETTINGS;
}

export function persistNotificationSettings(settings: NotificationSettings) {
  persistJsonToStorage(NOTIFICATION_SETTINGS_STORAGE_KEY, settings, NOTIFICATION_SETTINGS_LEGACY_KEYS);
}

import { loadJsonFromStorage, persistJsonToStorage } from "@/lib/repositories/browserStorage";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/admin/notification/defaults";
import { NOTIFICATION_SETTINGS_META } from "@/lib/admin/notification/meta";
import type { NotificationSettings } from "@/lib/admin/notification/types";

const NOTIFICATION_SETTINGS_STORAGE_KEY = "pbp.admin.notification-settings";
const NOTIFICATION_SETTINGS_LEGACY_KEYS = ["pbp.notification-settings"] as const;

function normalizeNotificationSettings(value: unknown): NotificationSettings {
  const candidate = typeof value === "object" && value !== null ? value as Partial<Record<keyof NotificationSettings, unknown>> : {};

  return Object.fromEntries(
    NOTIFICATION_SETTINGS_META.map(({ key, defaultEnabled }) => [key, typeof candidate[key] === "boolean" ? candidate[key] : defaultEnabled]),
  ) as NotificationSettings;
}

export function loadNotificationSettings(): NotificationSettings {
  const stored = loadJsonFromStorage<unknown>([
    NOTIFICATION_SETTINGS_STORAGE_KEY,
    ...NOTIFICATION_SETTINGS_LEGACY_KEYS,
  ]);

  return stored ? normalizeNotificationSettings(stored) : DEFAULT_NOTIFICATION_SETTINGS;
}

export function persistNotificationSettings(settings: NotificationSettings) {
  persistJsonToStorage(
    NOTIFICATION_SETTINGS_STORAGE_KEY,
    normalizeNotificationSettings(settings),
    NOTIFICATION_SETTINGS_LEGACY_KEYS,
  );
}

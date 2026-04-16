import { NOTIFICATION_SETTINGS_META } from "@/lib/admin/notification/meta";
import type { NotificationSettings } from "@/lib/admin/notification/types";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = Object.fromEntries(
  NOTIFICATION_SETTINGS_META.map(({ key, defaultEnabled }) => [key, defaultEnabled]),
) as NotificationSettings;

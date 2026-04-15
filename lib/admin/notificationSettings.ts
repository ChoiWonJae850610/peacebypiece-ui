import type { NotificationSettings } from "@/types/workflow";

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  created: false,
  updated: false,
  status_changed: true,
  materials_changed: false,
  outsourcing_changed: false,
  stock_changed: true,
  comment_added: true,
};

import { getI18n } from "@/lib/i18n";
import type { NotificationSettingKey } from "@/types/workflow";

const i18n = getI18n();
const presentation = i18n.workorder.presentation;

export const NOTIFICATION_SETTING_META: { key: NotificationSettingKey; label: string; description: string }[] = [
  { key: "created", label: presentation.notificationSettings.created.label, description: presentation.notificationSettings.created.description },
  { key: "updated", label: presentation.notificationSettings.updated.label, description: presentation.notificationSettings.updated.description },
  { key: "status_changed", label: presentation.notificationSettings.status_changed.label, description: presentation.notificationSettings.status_changed.description },
  { key: "materials_changed", label: presentation.notificationSettings.materials_changed.label, description: presentation.notificationSettings.materials_changed.description },
  { key: "outsourcing_changed", label: presentation.notificationSettings.outsourcing_changed.label, description: presentation.notificationSettings.outsourcing_changed.description },
  { key: "stock_changed", label: presentation.notificationSettings.stock_changed.label, description: presentation.notificationSettings.stock_changed.description },
  { key: "comment_added", label: presentation.notificationSettings.comment_added.label, description: presentation.notificationSettings.comment_added.description },
];

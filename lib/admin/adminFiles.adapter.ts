import {
  ADMIN_FILE_LIST_PLACEHOLDERS,
  ADMIN_FILE_TABS,
  ADMIN_FILE_TRASH_PLACEHOLDERS,
  ADMIN_FILE_USAGE_CARDS,
  ADMIN_STORAGE_POLICY_ITEMS,
} from "@/lib/admin/adminFiles.presentation";
import type { AdminFileManagementSnapshot } from "@/lib/admin/adminFiles.types";

export function getAdminFileManagementSnapshot(): AdminFileManagementSnapshot {
  return {
    usageCards: ADMIN_FILE_USAGE_CARDS,
    tabs: ADMIN_FILE_TABS,
    attachments: ADMIN_FILE_LIST_PLACEHOLDERS,
    trashItems: ADMIN_FILE_TRASH_PLACEHOLDERS,
    storagePolicies: ADMIN_STORAGE_POLICY_ITEMS,
  };
}

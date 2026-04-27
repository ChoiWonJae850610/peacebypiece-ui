"use client";

import AdminNotificationSettingsButton from "@/components/admin/AdminNotificationSettingsButton";
import AdminNotificationSettingsModal from "@/components/admin/AdminNotificationSettingsModal";
import { useAdminWorkspaceTools } from "@/lib/admin/useAdminWorkspaceTools";

export default function AdminWorkspaceTools() {
  const tools = useAdminWorkspaceTools();

  return (
    <>
      <AdminNotificationSettingsButton onClick={tools.openNotificationModal} />
      <AdminNotificationSettingsModal
        open={tools.activeModal === "notification"}
        onClose={tools.closeModal}
        notificationSettings={tools.notificationSettings}
        onToggleNotificationSetting={tools.handleToggleNotificationSetting}
      />
    </>
  );
}

"use client";

import AdminNotificationSettingsButton from "@/components/admin/AdminNotificationSettingsButton";
import AdminNotificationSettingsModal from "@/components/admin/AdminNotificationSettingsModal";
import AdminWorkOrderHistoryButton from "@/components/admin/AdminWorkOrderHistoryButton";
import AdminWorkOrderHistoryModal from "@/components/admin/AdminWorkOrderHistoryModal";
import { useAdminWorkspaceTools } from "@/lib/admin/useAdminWorkspaceTools";

export default function AdminWorkspaceTools() {
  const tools = useAdminWorkspaceTools();

  return (
    <>
      <AdminWorkOrderHistoryButton onClick={tools.openHistoryModal} />
      <AdminNotificationSettingsButton onClick={tools.openNotificationModal} />
      <AdminWorkOrderHistoryModal
        open={tools.openModal === "history"}
        onClose={tools.closeModal}
        historyLogs={tools.historyLogs}
        historyFilter={tools.historyFilter}
        onHistoryFilterChange={tools.setHistoryFilter}
      />
      <AdminNotificationSettingsModal
        open={tools.openModal === "notification"}
        onClose={tools.closeModal}
        notificationSettings={tools.notificationSettings}
        onToggleNotificationSetting={tools.handleToggleNotificationSetting}
      />
    </>
  );
}

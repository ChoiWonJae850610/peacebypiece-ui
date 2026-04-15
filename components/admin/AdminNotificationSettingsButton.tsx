"use client";

import { useMemo, useState } from "react";
import AdminNotificationSettingsModal from "@/components/admin/AdminNotificationSettingsModal";
import { isAdminRole } from "@/lib/constants/roles";
import { useWorkOrderCoreState } from "@/lib/hooks/workorder/useWorkOrderCoreState";
import { useWorkOrderHistory } from "@/lib/hooks/workorder/useWorkOrderHistory";
import { useI18n } from "@/lib/i18n";

export default function AdminNotificationSettingsButton() {
  const { i18n } = useI18n();
  const [open, setOpen] = useState(false);
  const coreState = useWorkOrderCoreState();

  const adminViewer = useMemo(
    () => coreState.users.find((user) => isAdminRole(user)) ?? coreState.currentUser,
    [coreState.currentUser, coreState.users],
  );

  const historyState = useWorkOrderHistory({
    historyLogs: coreState.historyLogs,
    selectedWorkOrderId: coreState.selectedId,
    currentUser: adminViewer,
    isAdmin: true,
    workOrders: coreState.workOrders,
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
      >
        {i18n.admin.notificationModal.title}
      </button>
      <AdminNotificationSettingsModal
        open={open}
        onClose={() => setOpen(false)}
        notificationSettings={historyState.notificationSettings}
        onToggleNotificationSetting={historyState.handleToggleNotificationSetting}
      />
    </>
  );
}

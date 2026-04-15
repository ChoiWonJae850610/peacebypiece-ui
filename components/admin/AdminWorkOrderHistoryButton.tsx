"use client";

import { useMemo, useState } from "react";
import AdminWorkOrderHistoryModal from "@/components/admin/AdminWorkOrderHistoryModal";
import { isAdminRole } from "@/lib/constants/roles";
import { useWorkOrderCoreState } from "@/lib/hooks/workorder/useWorkOrderCoreState";
import { useWorkOrderHistory } from "@/lib/hooks/workorder/useWorkOrderHistory";
import { useI18n } from "@/lib/i18n";

export default function AdminWorkOrderHistoryButton() {
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
        className="inline-flex items-center rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
      >
        {i18n.common.viewWorkOrderHistory}
      </button>
      <AdminWorkOrderHistoryModal
        open={open}
        onClose={() => setOpen(false)}
        historyLogs={historyState.adminHistoryLogs}
        historyFilter={historyState.historyFilter}
        onHistoryFilterChange={historyState.setHistoryFilter}
      />
    </>
  );
}

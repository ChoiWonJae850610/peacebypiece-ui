"use client";

import { useMemo, useState } from "react";
import { filterAdminHistoryEvents } from "@/lib/admin/history/selectors";
import type { AdminHistoryFilter } from "@/lib/admin/history/types";
import { isAdminRole, normalizeRoles } from "@/lib/constants/roles";
import { useWorkOrderCoreState } from "@/lib/hooks/workorder/useWorkOrderCoreState";

export function useAdminHistoryTools() {
  const coreState = useWorkOrderCoreState();
  const [historyFilter, setHistoryFilter] = useState<AdminHistoryFilter>("all");

  const adminViewer = useMemo(
    () => coreState.users.find((user) => isAdminRole(user)) ?? coreState.currentUser,
    [coreState.currentUser, coreState.users],
  );

  const currentRoles = useMemo(
    () => normalizeRoles(adminViewer.roles, adminViewer.role),
    [adminViewer.role, adminViewer.roles],
  );

  const historyEvents = useMemo(
    () => filterAdminHistoryEvents(coreState.historyLogs, historyFilter, currentRoles),
    [coreState.historyLogs, historyFilter, currentRoles],
  );

  return {
    historyEvents,
    historyFilter,
    setHistoryFilter,
  };
}

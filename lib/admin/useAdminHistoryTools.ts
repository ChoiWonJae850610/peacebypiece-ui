"use client";

import { useMemo, useState } from "react";
import { isAdminRole, normalizeRoles } from "@/lib/constants/roles";
import { useWorkOrderCoreState } from "@/lib/hooks/workorder/useWorkOrderCoreState";
import { filterHistoryLogs } from "@/lib/workorder/history/filters";
import type { HistoryFilter } from "@/types/workflow";

export function useAdminHistoryTools() {
  const coreState = useWorkOrderCoreState();
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");

  const adminViewer = useMemo(
    () => coreState.users.find((user) => isAdminRole(user)) ?? coreState.currentUser,
    [coreState.currentUser, coreState.users],
  );

  const currentRoles = useMemo(
    () => normalizeRoles(adminViewer.roles, adminViewer.role),
    [adminViewer.role, adminViewer.roles],
  );

  const historyLogs = useMemo(
    () => filterHistoryLogs(coreState.historyLogs, true, historyFilter, currentRoles),
    [coreState.historyLogs, historyFilter, currentRoles],
  );

  return {
    historyLogs,
    historyFilter,
    setHistoryFilter,
  };
}

"use client";

import { useMemo, useState } from "react";
import { selectAdminHistoryEventsByCategory } from "@/lib/admin/history/selectors";
import type { AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

export function useAdminHistoryTools(initialHistoryEvents: AdminHistoryEvent[] = []) {
  const [historyFilter, setHistoryFilter] = useState<AdminHistoryFilter>("all");

  const historyEvents = useMemo(
    () => selectAdminHistoryEventsByCategory(initialHistoryEvents, historyFilter),
    [initialHistoryEvents, historyFilter],
  );

  return {
    historyEvents,
    historyFilter,
    setHistoryFilter,
  };
}

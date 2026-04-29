"use client";

import { useMemo, useState } from "react";
import type { AdminHistoryEvent, AdminHistoryFilter } from "@/lib/admin/history/types";

function filterEventsByCategory(events: AdminHistoryEvent[], historyFilter: AdminHistoryFilter): AdminHistoryEvent[] {
  const seenIds = new Set<string>();

  return events.filter((item) => {
    if (historyFilter !== "all" && item.category !== historyFilter) return false;
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });
}

export function useAdminHistoryTools(initialHistoryEvents: AdminHistoryEvent[] = []) {
  const [historyFilter, setHistoryFilter] = useState<AdminHistoryFilter>("all");

  const historyEvents = useMemo(
    () => filterEventsByCategory(initialHistoryEvents, historyFilter),
    [initialHistoryEvents, historyFilter],
  );

  return {
    historyEvents,
    historyFilter,
    setHistoryFilter,
  };
}

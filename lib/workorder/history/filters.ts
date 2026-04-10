import { hasRole, normalizeRoles } from "@/lib/constants/roles";
import type { HistoryFilter, HistoryLog } from "@/types/workorder";
import type { RoleType } from "@/types/permission";

export function filterHistoryLogs(
  scopedHistoryLogs: HistoryLog[],
  isAdmin: boolean,
  historyFilter: HistoryFilter,
  currentRoles: RoleType[],
) {
  if (isAdmin) {
    if (historyFilter === "all") return scopedHistoryLogs;
    return scopedHistoryLogs.filter((item) => item.category === historyFilter);
  }

  const roles = normalizeRoles(currentRoles);
  if (hasRole(roles, "디자이너")) {
    return scopedHistoryLogs.filter((item) => item.category === "work" || item.category === "attachment");
  }

  return scopedHistoryLogs.filter((item) => item.category === "inventory" || item.category === "attachment");
}

import { ROLE, hasRole, normalizeRoles } from "@/lib/constants/roles";
import { HISTORY_CATEGORY, HISTORY_FILTER } from "@/lib/constants/workorderHistory";
import type { HistoryFilter, HistoryLog } from "@/types/workorder";
import type { RoleType } from "@/types/permission";

export function filterHistoryLogs(
  scopedHistoryLogs: HistoryLog[],
  isAdmin: boolean,
  historyFilter: HistoryFilter,
  currentRoles: RoleType[],
) {
  if (isAdmin) {
    if (historyFilter === HISTORY_FILTER.all) return scopedHistoryLogs;
    return scopedHistoryLogs.filter((item) => item.category === historyFilter);
  }

  const roles = normalizeRoles(currentRoles);
  if (hasRole(roles, ROLE.designer)) {
    return scopedHistoryLogs.filter((item) => item.category === HISTORY_CATEGORY.work || item.category === HISTORY_CATEGORY.attachment);
  }

  return scopedHistoryLogs.filter((item) => item.category === HISTORY_CATEGORY.inventory || item.category === HISTORY_CATEGORY.attachment);
}

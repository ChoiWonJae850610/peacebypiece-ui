import type { HistoryFilter, HistoryLog, InventoryLog } from "@/types/workorder";
import type { RoleType } from "@/types/permission";

export function nowLabel() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${month}-${date} ${hour}:${minute}`;
}

export function createHistoryLog(
  action: string,
  message: string,
  user: string,
  workOrderId: string,
  category: HistoryLog["category"],
  tone: HistoryLog["tone"],
): HistoryLog {
  return {
    id: `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workOrderId,
    category,
    action,
    message,
    user,
    time: nowLabel(),
    tone,
  };
}

export function filterHistoryLogs(
  scopedHistoryLogs: HistoryLog[],
  isAdmin: boolean,
  historyFilter: HistoryFilter,
  currentRole: RoleType,
) {
  if (isAdmin) {
    if (historyFilter === "all") return scopedHistoryLogs;
    return scopedHistoryLogs.filter((item) => item.category === historyFilter);
  }

  if (currentRole === "디자이너") {
    return scopedHistoryLogs.filter((item) => item.category === "work");
  }

  return scopedHistoryLogs.filter((item) => item.category === "inventory");
}

export function toInventoryLogs(scopedHistoryLogs: HistoryLog[]): InventoryLog[] {
  return scopedHistoryLogs
    .filter((item) => item.category === "inventory")
    .map((item) => ({
      id: item.id,
      type: item.action.includes("입고") ? "입고" : item.action.includes("보정") ? "보정" : "차감",
      delta: 0,
      memo: item.message,
      user: item.user,
      time: item.time,
    }));
}

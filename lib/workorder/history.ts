import type { HistoryFilter, HistoryLog, InventoryChange, InventoryLog } from "@/types/workorder";
import type { RoleType } from "@/types/permission";

export function nowLabel() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${month}-${date} ${hour}:${minute}`;
}

export function createHistoryLog(payload: {
  action: string;
  message: string;
  user: string;
  workOrderId: string;
  category: HistoryLog["category"];
  tone: HistoryLog["tone"];
  detailLines?: HistoryLog["detailLines"];
  transition?: HistoryLog["transition"];
}): HistoryLog {
  return {
    id: `${payload.category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workOrderId: payload.workOrderId,
    category: payload.category,
    action: payload.action,
    message: payload.message,
    user: payload.user,
    time: nowLabel(),
    tone: payload.tone,
    detailLines: payload.detailLines,
    transition: payload.transition ?? null,
  };
}

export function createCreationHistoryLog(user: string, workOrderId: string) {
  return createHistoryLog({
    action: "생성",
    message: "최초 생성되었습니다.",
    user,
    workOrderId,
    category: "work",
    tone: "blue",
    detailLines: [{ label: "작성자", value: user }],
  });
}

export function createUpdateHistoryLog(user: string, workOrderId: string, detailLines: HistoryLog["detailLines"]) {
  return createHistoryLog({
    action: "수정",
    message: "수정되었습니다.",
    user,
    workOrderId,
    category: "work",
    tone: "stone",
    detailLines,
  });
}

export function createStatusHistoryLog(user: string, workOrderId: string, from: string, to: string, actionLabel?: string) {
  return createHistoryLog({
    action: actionLabel ?? "상태 변경",
    message: "상태 변경되었습니다.",
    user,
    workOrderId,
    category: "work",
    tone: "violet",
    transition: { from, to },
    detailLines: [{ label: "변경", value: `${from} → ${to}` }],
  });
}

export function createInventoryHistoryLog(
  user: string,
  workOrderId: string,
  payload: { changes: InventoryChange[]; memo?: string },
) {
  const activeChanges = payload.changes.filter((item) => item.quantity > 0);
  const detailLines = activeChanges.map((item) => ({
    label: item.type,
    value: item.type === "보정" ? `${item.quantity}장으로 보정` : `${item.quantity}장 반영`,
  }));

  return createHistoryLog({
    action: "재고 수정",
    message: "재고 상태가 변경되었습니다.",
    user,
    workOrderId,
    category: "inventory",
    tone: activeChanges.some((item) => item.type === "차감") ? "rose" : activeChanges.some((item) => item.type === "보정") ? "amber" : "emerald",
    detailLines: [
      ...detailLines,
      ...(payload.memo?.trim() ? [{ label: "메모", value: payload.memo.trim() }] : []),
    ],
  });
}

export function createAttachmentHistoryLog(
  user: string,
  workOrderId: string,
  detailLines: HistoryLog["detailLines"],
) {
  return createHistoryLog({
    action: "첨부 변경",
    message: "첨부파일 내용이 수정되었습니다.",
    user,
    workOrderId,
    category: "attachment",
    tone: "stone",
    detailLines,
  });
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
    return scopedHistoryLogs.filter((item) => item.category === "work" || item.category === "attachment");
  }

  return scopedHistoryLogs.filter((item) => item.category === "inventory" || item.category === "attachment");
}

function parseInventoryChanges(log: HistoryLog): InventoryChange[] {
  const changes: InventoryChange[] = [];
  for (const detail of log.detailLines ?? []) {
    if (detail.label !== "입고" && detail.label !== "차감" && detail.label !== "보정") continue;
    const matched = detail.value.match(/(\d+)장/);
    const quantity = matched ? Number(matched[1]) : 0;
    if (quantity > 0) changes.push({ type: detail.label, quantity });
  }
  return changes;
}

function summarizeInventoryChanges(changes: InventoryChange[]) {
  if (changes.length === 0) return "재고 수정";
  return changes
    .map((item) => `${item.type} ${item.type === "보정" ? item.quantity : item.quantity}` + '장')
    .join(" / ");
}

function extractDelta(changes: InventoryChange[]) {
  return changes.reduce((acc, item) => {
    if (item.type === "입고") return acc + item.quantity;
    if (item.type === "차감") return acc - item.quantity;
    return acc;
  }, 0);
}

export function toInventoryLogs(scopedHistoryLogs: HistoryLog[]): InventoryLog[] {
  return scopedHistoryLogs
    .filter((item) => item.category === "inventory")
    .map((item) => {
      const changes = parseInventoryChanges(item);
      return {
        id: item.id,
        summary: summarizeInventoryChanges(changes),
        delta: extractDelta(changes),
        memo: item.detailLines?.map((detail) => `${detail.label ? `${detail.label}: ` : ""}${detail.value}`).join(" / ") ?? item.message,
        user: item.user,
        time: item.time,
        changes,
      };
    });
}

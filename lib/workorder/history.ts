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
  payload: { type: InventoryLog["type"]; quantity: number; memo?: string },
) {
  const quantityLabel = payload.type === "보정" ? `보정 ${payload.quantity}장 반영` : `${payload.type} ${payload.quantity}장 반영`;
  return createHistoryLog({
    action: payload.type === "보정" ? "재고 보정" : payload.type,
    message: "재고 상태가 변경되었습니다.",
    user,
    workOrderId,
    category: "inventory",
    tone: payload.type === "차감" ? "rose" : payload.type === "보정" ? "amber" : "emerald",
    detailLines: [
      { label: "변경", value: quantityLabel },
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

function extractDelta(log: HistoryLog) {
  const detailValue = log.detailLines?.find((item) => item.label === "변경")?.value ?? log.message;
  const matched = detailValue.match(/(\d+)장/);
  const quantity = matched ? Number(matched[1]) : 0;
  if (detailValue.includes("차감")) return -quantity;
  return quantity;
}

export function toInventoryLogs(scopedHistoryLogs: HistoryLog[]): InventoryLog[] {
  return scopedHistoryLogs
    .filter((item) => item.category === "inventory")
    .map((item) => ({
      id: item.id,
      type: item.action.includes("입고") ? "입고" : item.action.includes("보정") ? "보정" : "차감",
      delta: extractDelta(item),
      memo: item.detailLines?.map((detail) => `${detail.label ? `${detail.label}: ` : ""}${detail.value}`).join(" / ") ?? item.message,
      user: item.user,
      time: item.time,
    }));
}

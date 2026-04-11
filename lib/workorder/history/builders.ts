import { INVENTORY_CHANGE_TYPE } from "@/lib/constants/workorderDomain";
import type { HistoryLog, InventoryChange } from "@/types/workorder";

function withActor(summary: string, user: string) {
  return `${summary} · ${user}`;
}

function buildHistorySummary(payload: {
  action: string;
  user: string;
  transition?: HistoryLog["transition"];
  detailLines?: HistoryLog["detailLines"];
}) {
  if (payload.transition) {
    return withActor(`${payload.action}: ${payload.transition.from} → ${payload.transition.to}`, payload.user);
  }

  const firstDetail = payload.detailLines?.find((detail) => detail.value.trim())?.value?.trim();
  if (firstDetail) {
    const compact = firstDetail.length > 42 ? `${firstDetail.slice(0, 42)}…` : firstDetail;
    return withActor(`${payload.action}: ${compact}`, payload.user);
  }

  return withActor(payload.action, payload.user);
}

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
  summary?: string;
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
    summary: payload.summary ?? buildHistorySummary(payload),
    detailLines: payload.detailLines,
    transition: payload.transition ?? null,
  };
}

export function createCreationHistoryLog(user: string, workOrderId: string) {
  return createHistoryLog({
    action: "작업지시서 생성",
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
    action: "기본사항 수정",
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
    value: item.type === INVENTORY_CHANGE_TYPE.adjustment ? `${item.quantity}장으로 보정` : `${item.quantity}장 반영`,
  }));

  return createHistoryLog({
    action: "재고 변경",
    message: "재고 상태가 변경되었습니다.",
    user,
    workOrderId,
    category: "inventory",
    tone: activeChanges.some((item) => item.type === INVENTORY_CHANGE_TYPE.deduction) ? "rose" : activeChanges.some((item) => item.type === INVENTORY_CHANGE_TYPE.adjustment) ? "amber" : "emerald",
    detailLines: [
      ...detailLines,
      ...(payload.memo?.trim() ? [{ label: "메모", value: payload.memo.trim() }] : []),
    ],
  });
}

export function createInspectionCompleteHistoryLog(
  user: string,
  workOrderId: string,
  payload: { inboundQuantity: number; nextInventoryQuantity: number; memo?: string },
) {
  return createHistoryLog({
    action: "검수 완료",
    message: "검수 완료와 재고 반영이 기록되었습니다.",
    user,
    workOrderId,
    category: "inventory",
    tone: "emerald",
    detailLines: [
      { label: INVENTORY_CHANGE_TYPE.inbound, value: `${payload.inboundQuantity}장 반영` },
      { label: "최종 재고", value: `${payload.nextInventoryQuantity}장` },
      ...(payload.memo?.trim() ? [{ label: "메모", value: payload.memo.trim() }] : []),
    ],
  });
}

export function createMemoHistoryLog(
  user: string,
  workOrderId: string,
  payload: { action: "thread" | "reply"; content: string; attachmentNames?: string[] },
) {
  const action = payload.action === "thread" ? "메모 작성" : "댓글 작성";
  const trimmedContent = payload.content.trim();
  const attachmentNames = payload.attachmentNames?.filter(Boolean) ?? [];

  const summary = attachmentNames.length > 0
    ? `${action}(첨부 ${attachmentNames.length}개) · ${user}`
    : `${action} · ${user}`;

  return createHistoryLog({
    action,
    message: payload.action === "thread" ? "작업 메모가 등록되었습니다." : "작업 메모 댓글이 등록되었습니다.",
    user,
    workOrderId,
    category: "work",
    tone: "blue",
    summary,
    detailLines: [
      { label: "내용", value: trimmedContent },
      ...(attachmentNames.length > 0 ? [{ label: `첨부 ${attachmentNames.length}개`, value: attachmentNames.join(", ") }] : []),
    ],
  });
}

export function createReorderHistoryLog(user: string, workOrderId: string, payload: { sourceTitle: string; nextTitle: string }) {
  return createHistoryLog({
    action: "리오더 생성",
    message: "이전 작업지시서를 복사해 새 작업지시서가 생성되었습니다.",
    user,
    workOrderId,
    category: "work",
    tone: "blue",
    detailLines: [
      { label: "원본", value: payload.sourceTitle },
      { label: "생성", value: payload.nextTitle },
    ],
  });
}

export function createTitleRenameHistoryLog(
  user: string,
  workOrderId: string,
  payload: { from: string; to: string; appliedToGroup?: boolean },
) {
  const detailLines = [
    { label: "이전", value: payload.from || "-" },
    { label: "변경", value: payload.to || "-" },
    ...(payload.appliedToGroup ? [{ label: "반영 범위", value: "리오더 계열 전체" }] : []),
  ];

  return createHistoryLog({
    action: "작업지시서명 변경",
    message: payload.appliedToGroup ? "작업지시서명이 리오더 계열 전체에 반영되었습니다." : "작업지시서명이 변경되었습니다.",
    user,
    workOrderId,
    category: "work",
    tone: "blue",
    detailLines,
  });
}

export function createManagerChangeHistoryLog(user: string, workOrderId: string, from: string, to: string) {
  return createHistoryLog({
    action: "담당자 변경",
    message: "담당자가 변경되었습니다.",
    user,
    workOrderId,
    category: "work",
    tone: "blue",
    detailLines: [
      { label: "이전", value: from || "-" },
      { label: "변경", value: to || "-" },
    ],
  });
}

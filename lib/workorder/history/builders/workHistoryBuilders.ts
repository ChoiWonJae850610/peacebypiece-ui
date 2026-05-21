import { WORK_ORDER_KIND, type WorkOrderKindValue } from "@/lib/constants/workorderIdentity";
import { HISTORY_CATEGORY, HISTORY_TONE, MEMO_HISTORY_ACTION, type MemoHistoryActionValue } from "@/lib/constants/workorderHistory";
import { createHistoryLog, defaultHistoryText, type DetailLine, type HistoryText } from "@/lib/workorder/history/builders/shared";
import type { HistoryLog } from "@/types/workorder";

function formatHistoryTitle(title?: string | null) {
  const normalized = String(title ?? "").trim();
  return normalized ? `[${normalized}]` : "-";
}

function buildWorkOrderIdentityDetailLines(
  title: string | undefined,
  text: HistoryText,
): DetailLine[] {
  return [{ label: text.detailLabels.title, value: formatHistoryTitle(title) }];
}
export function createCreationHistoryLog(
  user: string,
  workOrderId: string,
  payload: { title?: string } = {},
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.created,
    message: text.messages.created,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.blue,
    detailLines: [
      ...buildWorkOrderIdentityDetailLines(payload.title, text),
      { label: text.detailLabels.author, value: user },
    ],
    text,
  });
}

export function createUpdateHistoryLog(
  user: string,
  workOrderId: string,
  detailLines: HistoryLog["detailLines"],
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.updated,
    message: text.messages.updated,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.stone,
    detailLines,
    text,
  });
}

export function createStatusHistoryLog(
  user: string,
  workOrderId: string,
  from: string,
  to: string,
  actionLabel?: string,
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: actionLabel ?? text.actions.statusChanged,
    message: text.messages.statusChanged,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.violet,
    transition: { from, to },
    detailLines: [{ label: text.detailLabels.changed, value: `${from}${text.transitionArrow}${to}` }],
    text,
  });
}

export function createMemoHistoryLog(
  user: string,
  workOrderId: string,
  payload: { action: MemoHistoryActionValue; content: string },
  text: HistoryText = defaultHistoryText,
) {
  const action = payload.action === MEMO_HISTORY_ACTION.thread ? text.actions.memoThreadCreated : text.actions.memoReplyCreated;
  const trimmedContent = payload.content.trim();
  const summary = ``;

  return createHistoryLog({
    action,
    message: payload.action === MEMO_HISTORY_ACTION.thread ? text.messages.memoThreadCreated : text.messages.memoReplyCreated,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.blue,
    summary,
    detailLines: [
      { label: text.detailLabels.content, value: trimmedContent },
    ],
    text,
  });
}

export function createReorderHistoryLog(
  user: string,
  workOrderId: string,
  payload: { sourceTitle: string; nextTitle: string },
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.reorderCreated,
    message: text.messages.reorderCreated,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.blue,
    detailLines: [
      ...buildWorkOrderIdentityDetailLines(payload.nextTitle, text),
      { label: text.detailLabels.original, value: formatHistoryTitle(payload.sourceTitle) },
    ],
    text,
  });
}

export function createFactoryOrderRequestHistoryLog(
  user: string,
  workOrderId: string,
  payload: { factoryName: string; quantity: number; requestedAt: string },
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.factoryOrderRequested,
    message: text.messages.factoryOrderRequested,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.violet,
    detailLines: [
      { label: text.detailLabels.factory ?? "공장", value: payload.factoryName || "-" },
      { label: text.detailLabels.quantity ?? "수량", value: `${payload.quantity.toLocaleString()}장` },
      { label: text.detailLabels.requestedAt ?? "발주 시각", value: payload.requestedAt },
    ],
    text,
  });
}

export function createReinspectionRequestHistoryLog(
  user: string,
  workOrderId: string,
  payload: { from: string; to: string; reason?: string | null },
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.reinspectionRequested,
    message: text.messages.reinspectionRequested,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.emerald,
    transition: { from: payload.from, to: payload.to },
    detailLines: [
      { label: text.detailLabels.changed, value: `${payload.from}${text.transitionArrow}${payload.to}` },
      ...(payload.reason ? [{ label: text.detailLabels.reason ?? "사유", value: payload.reason }] : []),
    ],
    text,
  });
}

export function createDeletionHistoryLog(
  user: string,
  workOrderId: string,
  payload: { title: string },
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.deleted,
    message: text.messages.deleted,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.stone,
    detailLines: [
      ...buildWorkOrderIdentityDetailLines(payload.title, text),
      { label: text.detailLabels.author, value: user },
    ],
    text,
  });
}

export function createTitleRenameHistoryLog(
  user: string,
  workOrderId: string,
  payload: { from: string; to: string; appliedToGroup?: boolean },
  text: HistoryText = defaultHistoryText,
) {
  const detailLines: DetailLine[] = [
    { label: text.detailLabels.previous, value: payload.from || "-" },
    { label: text.detailLabels.changed, value: payload.to || "-" },
    ...(payload.appliedToGroup ? [{ label: text.detailLabels.appliedRange, value: text.detailLabels.reorderSeries }] : []),
  ];

  return createHistoryLog({
    action: text.actions.titleRenamed,
    message: payload.appliedToGroup ? text.messages.titleRenamedSeries : text.messages.titleRenamed,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.blue,
    detailLines,
    text,
  });
}

export function createManagerChangeHistoryLog(
  user: string,
  workOrderId: string,
  from: string,
  to: string,
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.managerChanged,
    message: text.messages.managerChanged,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: HISTORY_TONE.blue,
    detailLines: [
      { label: text.detailLabels.previous, value: from || "-" },
      { label: text.detailLabels.changed, value: to || "-" },
    ],
    text,
  });
}


function getWorkOrderKindLabel(kind: WorkOrderKindValue, text: HistoryText) {
  if (kind === WORK_ORDER_KIND.sample) return text.detailLabels.typeSample;
  if (kind === WORK_ORDER_KIND.rework) return text.detailLabels.typeRework;
  return text.detailLabels.typeMain;
}

export function createWorkOrderKindChangeHistoryLog(
  user: string,
  workOrderId: string,
  payload: {
    fromTitle: string;
    toTitle: string;
    fromKind: WorkOrderKindValue;
    toKind: WorkOrderKindValue;
  },
  text: HistoryText = defaultHistoryText,
) {
  const action = payload.toKind === WORK_ORDER_KIND.rework
    ? text.actions.reworkConverted
    : payload.fromKind === WORK_ORDER_KIND.rework && payload.toKind === WORK_ORDER_KIND.main
      ? text.actions.reworkRestored
      : text.actions.kindChanged;
  const message = payload.toKind === WORK_ORDER_KIND.rework
    ? text.messages.reworkConverted
    : payload.fromKind === WORK_ORDER_KIND.rework && payload.toKind === WORK_ORDER_KIND.main
      ? text.messages.reworkRestored
      : text.messages.kindChanged;

  return createHistoryLog({
    action,
    message,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.work,
    tone: payload.toKind === WORK_ORDER_KIND.rework ? HISTORY_TONE.violet : HISTORY_TONE.blue,
    summary: `${action}: ${formatHistoryTitle(payload.fromTitle)}${text.transitionArrow}${formatHistoryTitle(payload.toTitle)}${text.actorSeparator}${user}`,
    detailLines: [
      { label: text.detailLabels.previous, value: formatHistoryTitle(payload.fromTitle) },
      { label: text.detailLabels.changed, value: formatHistoryTitle(payload.toTitle) },
      { label: text.detailLabels.type, value: `${getWorkOrderKindLabel(payload.fromKind, text)}${text.transitionArrow}${getWorkOrderKindLabel(payload.toKind, text)}` },
    ],
    text,
  });
}

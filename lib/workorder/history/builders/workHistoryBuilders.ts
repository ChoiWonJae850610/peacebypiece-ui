import { createHistoryLog, defaultHistoryText, type DetailLine, formatTemplate, type HistoryText } from "@/lib/workorder/history/builders/shared";
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
    category: "work",
    tone: "blue",
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
    category: "work",
    tone: "stone",
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
    category: "work",
    tone: "violet",
    transition: { from, to },
    detailLines: [{ label: text.detailLabels.changed, value: `${from}${text.transitionArrow}${to}` }],
    text,
  });
}

export function createMemoHistoryLog(
  user: string,
  workOrderId: string,
  payload: { action: "thread" | "reply"; content: string; attachmentNames?: string[] },
  text: HistoryText = defaultHistoryText,
) {
  const action = payload.action === "thread" ? text.actions.memoThreadCreated : text.actions.memoReplyCreated;
  const trimmedContent = payload.content.trim();
  const attachmentNames = payload.attachmentNames?.filter(Boolean) ?? [];

  const summary =
    attachmentNames.length > 0
      ? `${action}(${formatTemplate(text.detailLabels.summaryMemoAttachmentCountFormat, { count: attachmentNames.length })})${text.actorSeparator}${user}`
      : `${action}${text.actorSeparator}${user}`;

  return createHistoryLog({
    action,
    message: payload.action === "thread" ? text.messages.memoThreadCreated : text.messages.memoReplyCreated,
    user,
    workOrderId,
    category: "work",
    tone: "blue",
    summary,
    detailLines: [
      { label: text.detailLabels.content, value: trimmedContent },
      ...(attachmentNames.length > 0
        ? [{ label: formatTemplate(text.detailLabels.attachmentCountFormat, { count: attachmentNames.length }), value: attachmentNames.join(", ") }]
        : []),
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
    category: "work",
    tone: "blue",
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
    action: text.actions.factoryOrderRequested ?? text.actions.statusChanged,
    message: text.messages.factoryOrderRequested ?? text.messages.statusChanged,
    user,
    workOrderId,
    category: "work",
    tone: "violet",
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
    category: "work",
    tone: "emerald",
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
    category: "work",
    tone: "stone",
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
    category: "work",
    tone: "blue",
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
    category: "work",
    tone: "blue",
    detailLines: [
      { label: text.detailLabels.previous, value: from || "-" },
      { label: text.detailLabels.changed, value: to || "-" },
    ],
    text,
  });
}


function getWorkOrderKindLabel(kind: "sample" | "main" | "rework", text: HistoryText) {
  if (kind === "sample") return text.detailLabels.typeSample;
  if (kind === "rework") return text.detailLabels.typeRework;
  return text.detailLabels.typeMain;
}

export function createWorkOrderKindChangeHistoryLog(
  user: string,
  workOrderId: string,
  payload: {
    fromTitle: string;
    toTitle: string;
    fromKind: "sample" | "main" | "rework";
    toKind: "sample" | "main" | "rework";
  },
  text: HistoryText = defaultHistoryText,
) {
  const action = payload.toKind === "rework"
    ? text.actions.reworkConverted
    : payload.fromKind === "rework" && payload.toKind === "main"
      ? text.actions.reworkRestored
      : text.actions.kindChanged;
  const message = payload.toKind === "rework"
    ? text.messages.reworkConverted
    : payload.fromKind === "rework" && payload.toKind === "main"
      ? text.messages.reworkRestored
      : text.messages.kindChanged;

  return createHistoryLog({
    action,
    message,
    user,
    workOrderId,
    category: "work",
    tone: payload.toKind === "rework" ? "violet" : "blue",
    summary: `${action}: ${formatHistoryTitle(payload.fromTitle)}${text.transitionArrow}${formatHistoryTitle(payload.toTitle)}${text.actorSeparator}${user}`,
    detailLines: [
      { label: text.detailLabels.previous, value: formatHistoryTitle(payload.fromTitle) },
      { label: text.detailLabels.changed, value: formatHistoryTitle(payload.toTitle) },
      { label: text.detailLabels.type, value: `${getWorkOrderKindLabel(payload.fromKind, text)}${text.transitionArrow}${getWorkOrderKindLabel(payload.toKind, text)}` },
    ],
    text,
  });
}

import { createHistoryLog, defaultHistoryText, type DetailLine, formatTemplate, type HistoryText } from "@/lib/workorder/history/builders/shared";
import type { HistoryLog } from "@/types/workorder";

export function createCreationHistoryLog(user: string, workOrderId: string, text: HistoryText = defaultHistoryText) {
  return createHistoryLog({
    action: text.actions.created,
    message: text.messages.created,
    user,
    workOrderId,
    category: "work",
    tone: "blue",
    detailLines: [{ label: text.detailLabels.author, value: user }],
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
      { label: text.detailLabels.original, value: payload.sourceTitle },
      { label: text.detailLabels.created, value: payload.nextTitle },
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

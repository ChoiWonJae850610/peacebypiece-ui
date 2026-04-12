import { INVENTORY_CHANGE_TYPE } from "@/lib/constants/workorderDomain";
import { DEFAULT_LOCALE, getI18n } from "@/lib/i18n";
import type { HistoryLog, InventoryChange } from "@/types/workorder";

const defaultHistoryText = getI18n(DEFAULT_LOCALE).workorder.history;
export type HistoryText = typeof defaultHistoryText;

type DetailLine = NonNullable<HistoryLog["detailLines"]>[number];

function formatTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function withActor(summary: string, user: string, text: HistoryText) {
  return `${summary}${text.actorSeparator}${user}`;
}

function buildHistorySummary(payload: {
  action: string;
  user: string;
  text: HistoryText;
  transition?: HistoryLog["transition"];
  detailLines?: HistoryLog["detailLines"];
}) {
  if (payload.transition) {
    return withActor(
      `${payload.action}: ${payload.transition.from}${payload.text.transitionArrow}${payload.transition.to}`,
      payload.user,
      payload.text,
    );
  }

  const firstDetail = payload.detailLines?.find((detail) => detail.value.trim())?.value?.trim();
  if (firstDetail) {
    const compact = firstDetail.length > 42 ? `${firstDetail.slice(0, 42)}…` : firstDetail;
    return withActor(`${payload.action}: ${compact}`, payload.user, payload.text);
  }

  return withActor(payload.action, payload.user, payload.text);
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
  text?: HistoryText;
}): HistoryLog {
  const text = payload.text ?? defaultHistoryText;
  return {
    id: `${payload.category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    workOrderId: payload.workOrderId,
    category: payload.category,
    action: payload.action,
    message: payload.message,
    user: payload.user,
    time: nowLabel(),
    tone: payload.tone,
    summary: payload.summary ?? buildHistorySummary({ ...payload, text }),
    detailLines: payload.detailLines,
    transition: payload.transition ?? null,
  };
}

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

export function createInventoryHistoryLog(
  user: string,
  workOrderId: string,
  payload: { changes: InventoryChange[]; memo?: string },
  text: HistoryText = defaultHistoryText,
) {
  const activeChanges = payload.changes.filter((item) => item.quantity > 0);
  const detailLines: DetailLine[] = activeChanges.map((item) => ({
    label: item.type,
    value:
      item.type === INVENTORY_CHANGE_TYPE.adjustment
        ? formatTemplate(text.detailLabels.quantityAdjustedFormat, { quantity: item.quantity })
        : formatTemplate(text.detailLabels.quantityAppliedFormat, { quantity: item.quantity }),
  }));

  return createHistoryLog({
    action: text.actions.inventoryChanged,
    message: text.messages.inventoryChanged,
    user,
    workOrderId,
    category: "inventory",
    tone: activeChanges.some((item) => item.type === INVENTORY_CHANGE_TYPE.deduction)
      ? "rose"
      : activeChanges.some((item) => item.type === INVENTORY_CHANGE_TYPE.adjustment)
        ? "amber"
        : "emerald",
    detailLines: [
      ...detailLines,
      ...(payload.memo?.trim() ? [{ label: text.detailLabels.memo, value: payload.memo.trim() }] : []),
    ],
    text,
  });
}

export function createInspectionCompleteHistoryLog(
  user: string,
  workOrderId: string,
  payload: { inboundQuantity: number; nextInventoryQuantity: number; memo?: string },
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.inspectionCompleted,
    message: text.messages.inspectionCompleted,
    user,
    workOrderId,
    category: "inventory",
    tone: "emerald",
    detailLines: [
      {
        label: INVENTORY_CHANGE_TYPE.inbound,
        value: formatTemplate(text.detailLabels.quantityAppliedFormat, { quantity: payload.inboundQuantity }),
      },
      {
        label: text.detailLabels.finalInventory,
        value: formatTemplate(text.detailLabels.quantityCurrentFormat, { quantity: payload.nextInventoryQuantity }),
      },
      ...(payload.memo?.trim() ? [{ label: text.detailLabels.memo, value: payload.memo.trim() }] : []),
    ],
    text,
  });
}

export function createAttachmentUploadHistoryLog(
  user: string,
  workOrderId: string,
  attachments: { name: string }[],
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.officialAttachmentUploaded,
    message: text.messages.officialAttachmentUploaded,
    user,
    workOrderId,
    category: "attachment",
    tone: "blue",
    summary: `${formatTemplate(text.detailLabels.summaryOfficialAttachmentCountFormat, { count: attachments.length })}${text.actorSeparator}${user}`,
    detailLines: attachments.map((attachment, index) => ({
      label: formatTemplate(text.detailLabels.fileCountFormat, { index: index + 1 }),
      value: attachment.name,
    })),
    text,
  });
}

export function createAttachmentDeleteHistoryLog(
  user: string,
  workOrderId: string,
  attachment: { name: string; scope?: string | null },
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.attachmentDeleted,
    message: text.messages.attachmentDeleted,
    user,
    workOrderId,
    category: "attachment",
    tone: "rose",
    detailLines: [
      { label: text.detailLabels.file, value: attachment.name },
      {
        label: text.detailLabels.scope,
        value: attachment.scope === "memo" ? text.detailLabels.memoAttachment : text.detailLabels.officialAttachment,
      },
    ],
    text,
  });
}

export function createAttachmentPromoteHistoryLog(
  user: string,
  workOrderId: string,
  attachment: { name: string },
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: text.actions.memoAttachmentPromoted,
    message: text.messages.memoAttachmentPromoted,
    user,
    workOrderId,
    category: "attachment",
    tone: "emerald",
    detailLines: [{ label: text.detailLabels.file, value: attachment.name }],
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

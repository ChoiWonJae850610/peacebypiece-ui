import { createHistoryLog, defaultHistoryText, formatTemplate, type HistoryText } from "@/lib/workorder/history/builders/shared";

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

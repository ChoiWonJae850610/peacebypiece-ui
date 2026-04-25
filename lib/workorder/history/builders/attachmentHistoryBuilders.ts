import { createHistoryLog, defaultHistoryText, formatTemplate, type HistoryText } from "@/lib/workorder/history/builders/shared";

export function createAttachmentUploadHistoryLog(
  user: string,
  workOrderId: string,
  attachments: { name: string }[],
  scope: "design" | "attachment" = "attachment",
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: scope === "design" ? text.actions.designAttachmentUploaded : text.actions.officialAttachmentUploaded,
    message: scope === "design" ? text.messages.designAttachmentUploaded : text.messages.officialAttachmentUploaded,
    user,
    workOrderId,
    category: "attachment",
    tone: "blue",
    summary: `${formatTemplate(scope === "design" ? text.detailLabels.summaryDesignAttachmentCountFormat : text.detailLabels.summaryOfficialAttachmentCountFormat, { count: attachments.length })}${text.actorSeparator}${user}`,
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
        value: attachment.scope === "design" ? text.detailLabels.designAttachment : text.detailLabels.officialAttachment,
      },
    ],
    text,
  });
}


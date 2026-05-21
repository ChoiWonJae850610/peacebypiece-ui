import { ATTACHMENT_SCOPE, isDesignAttachmentScope, type UploadableAttachmentScopeValue } from "@/lib/constants/workorderIdentity";
import { HISTORY_CATEGORY, HISTORY_TONE } from "@/lib/constants/workorderHistory";
import { createHistoryLog, defaultHistoryText, formatTemplate, type HistoryText } from "@/lib/workorder/history/builders/shared";

export function createAttachmentUploadHistoryLog(
  user: string,
  workOrderId: string,
  attachments: { name: string }[],
  scope: UploadableAttachmentScopeValue = ATTACHMENT_SCOPE.attachment,
  text: HistoryText = defaultHistoryText,
) {
  return createHistoryLog({
    action: isDesignAttachmentScope(scope) ? text.actions.designAttachmentUploaded : text.actions.officialAttachmentUploaded,
    message: isDesignAttachmentScope(scope) ? text.messages.designAttachmentUploaded : text.messages.officialAttachmentUploaded,
    user,
    workOrderId,
    category: HISTORY_CATEGORY.attachment,
    tone: HISTORY_TONE.blue,
    summary: `${formatTemplate(isDesignAttachmentScope(scope) ? text.detailLabels.summaryDesignAttachmentCountFormat : text.detailLabels.summaryOfficialAttachmentCountFormat, { count: attachments.length })}${text.actorSeparator}${user}`,
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
    category: HISTORY_CATEGORY.attachment,
    tone: HISTORY_TONE.rose,
    detailLines: [
      { label: text.detailLabels.file, value: attachment.name },
      {
        label: text.detailLabels.scope,
        value: isDesignAttachmentScope(attachment.scope) ? text.detailLabels.designAttachment : text.detailLabels.officialAttachment,
      },
    ],
    text,
  });
}


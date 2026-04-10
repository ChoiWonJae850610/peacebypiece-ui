"use client";

import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import { canDeleteAttachmentByUser, isOfficialAttachment } from "@/lib/permissions/attachments";
import { createMemoAttachments, createOfficialAttachments } from "@/lib/workorder/attachments";
import { addMemoReply, addMemoThread, appendAttachments, appendMemoAttachmentsToReply, appendMemoAttachmentsToThread, promoteAttachmentToOfficial, removeAttachment } from "@/lib/workorder/actions";
import { createMemoHistoryLog } from "@/lib/workorder/history";
import { getMemoPayloadInfo, createMemoReplyDraft, createMemoThreadDraft } from "@/lib/workorder/memo";
import type { Attachment, HistoryLog, MemoAttachmentPayload, UserProfile, WorkOrder } from "@/types/workorder";

export function useWorkOrderAttachments({
  attachmentInputRef,
  canUploadOfficialAttachments,
  isReviewRequestLocked,
  currentUser,
  selectedWorkOrder,
  attachmentPreviewId,
  setAttachmentPreviewId,
  setWorkOrders,
  setHistoryLogs,
  setSaveStatus,
  setToastMessage,
}: {
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  canUploadOfficialAttachments: boolean;
  isReviewRequestLocked: boolean;
  currentUser: UserProfile;
  selectedWorkOrder: WorkOrder;
  attachmentPreviewId: string | null;
  setAttachmentPreviewId: Dispatch<SetStateAction<string | null>>;
  setWorkOrders: Dispatch<SetStateAction<WorkOrder[]>>;
  setHistoryLogs: Dispatch<SetStateAction<HistoryLog[]>>;
  setSaveStatus: Dispatch<SetStateAction<"saved" | "dirty" | "saving">>;
  setToastMessage: Dispatch<SetStateAction<string | null>>;
}) {
  const handleOpenAttachmentPicker = () => {
    if (!canUploadOfficialAttachments) return;
    attachmentInputRef.current?.click();
  };

  const handleAttachmentFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canUploadOfficialAttachments) {
      event.target.value = "";
      return;
    }
    const files = Array.from<File>(event.target.files ?? []);
    if (files.length === 0) return;
    const nextAttachments = createOfficialAttachments(files, currentUser);
    setWorkOrders((prev) => appendAttachments(prev, selectedWorkOrder.id, nextAttachments));
    setSaveStatus("dirty");
    event.target.value = "";
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId) ?? null;
    if (isReviewRequestLocked && isOfficialAttachment(targetAttachment)) {
      return;
    }
    if (!canDeleteAttachmentByUser(currentUser, targetAttachment)) {
      return;
    }
    setWorkOrders((prev) => removeAttachment(prev, selectedWorkOrder.id, attachmentId));
    if (attachmentPreviewId === attachmentId) {
      setAttachmentPreviewId(null);
    }
    setSaveStatus("dirty");
  };

  const handleCreateMemoThread = (content: string, payload?: MemoAttachmentPayload) => {
    const trimmed = content.trim();
    const { selectedAttachmentIds, files } = getMemoPayloadInfo(payload);
    if (!trimmed) return;

    const nextThread = createMemoThreadDraft(trimmed, currentUser, selectedAttachmentIds);
    const memoAttachments = createMemoAttachments(files, currentUser, { threadId: nextThread.id });

    setWorkOrders((prev) => {
      const withThread = addMemoThread(prev, selectedWorkOrder.id, nextThread);
      if (memoAttachments.length === 0) return withThread;
      return appendMemoAttachmentsToThread(withThread, selectedWorkOrder.id, nextThread.id, {
        attachmentIds: memoAttachments.map((item) => item.id),
        attachments: memoAttachments,
      });
    });
    setHistoryLogs((prev) => [
      createMemoHistoryLog(currentUser.name, selectedWorkOrder.id, {
        action: "thread",
        content: trimmed,
        attachmentNames: [
          ...selectedAttachmentIds
            .map((attachmentId) => selectedWorkOrder.attachments.find((item) => item.id === attachmentId)?.name)
            .filter((name): name is string => Boolean(name)),
          ...memoAttachments.map((attachment) => attachment.name),
        ],
      }),
      ...prev,
    ]);
    setSaveStatus("dirty");
    setToastMessage(
      memoAttachments.length > 0 || selectedAttachmentIds.length > 0
        ? "첨부가 포함된 작업 메모가 등록되었습니다."
        : "작업 메모가 등록되었습니다.",
    );
  };

  const handleCreateMemoReply = (threadId: string, content: string, payload?: MemoAttachmentPayload) => {
    const trimmed = content.trim();
    const { selectedAttachmentIds, files } = getMemoPayloadInfo(payload);
    if (!trimmed) return;

    const nextReply = createMemoReplyDraft(trimmed, currentUser, selectedAttachmentIds);
    const memoAttachments = createMemoAttachments(files, currentUser, { threadId, replyId: nextReply.id });

    setWorkOrders((prev) => {
      const withReply = addMemoReply(prev, selectedWorkOrder.id, threadId, nextReply);
      if (memoAttachments.length === 0) return withReply;
      return appendMemoAttachmentsToReply(withReply, selectedWorkOrder.id, threadId, nextReply.id, {
        attachmentIds: memoAttachments.map((item) => item.id),
        attachments: memoAttachments,
      });
    });
    setHistoryLogs((prev) => [
      createMemoHistoryLog(currentUser.name, selectedWorkOrder.id, {
        action: "reply",
        content: trimmed,
        attachmentNames: [
          ...selectedAttachmentIds
            .map((attachmentId) => selectedWorkOrder.attachments.find((item) => item.id === attachmentId)?.name)
            .filter((name): name is string => Boolean(name)),
          ...memoAttachments.map((attachment) => attachment.name),
        ],
      }),
      ...prev,
    ]);
    setSaveStatus("dirty");
    setToastMessage(
      memoAttachments.length > 0 || selectedAttachmentIds.length > 0
        ? "첨부가 포함된 메모 댓글이 등록되었습니다."
        : "메모 댓글이 등록되었습니다.",
    );
  };

  const handlePromoteMemoAttachment = (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId);
    if (!targetAttachment || (targetAttachment.scope ?? "official") === "official" || !canUploadOfficialAttachments || isReviewRequestLocked) return;

    setWorkOrders((prev) =>
      promoteAttachmentToOfficial(prev, selectedWorkOrder.id, attachmentId, {
        ownerId: currentUser.id,
        ownerName: currentUser.name,
      }),
    );

    setSaveStatus("dirty");
    setToastMessage("메모 첨부가 공식 첨부로 승격되었습니다.");
  };

  const canDeleteAttachment = (attachment: Attachment | null) => {
    if (isReviewRequestLocked && isOfficialAttachment(attachment)) return false;
    return canDeleteAttachmentByUser(currentUser, attachment);
  };

  return {
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleDeleteAttachment,
    handleCreateMemoThread,
    handleCreateMemoReply,
    handlePromoteMemoAttachment,
    canDeleteAttachment,
  };
}

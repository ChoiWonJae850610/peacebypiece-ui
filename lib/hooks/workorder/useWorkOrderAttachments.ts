"use client";

import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import { promoteAttachmentToOfficial } from "@/lib/workorder/actions";
import { applyOfficialAttachmentFiles, canDeleteAttachmentForCurrentUser, deleteWorkOrderAttachment, openOfficialAttachmentPicker } from "@/lib/workorder/attachments/attachmentActions";
import { createMemoHistoryLog } from "@/lib/workorder/history";
import { createMemoReply, createMemoThread } from "@/lib/workorder/memo/memoActions";
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
    openOfficialAttachmentPicker(attachmentInputRef, canUploadOfficialAttachments);
  };

  const handleAttachmentFiles = (event: ChangeEvent<HTMLInputElement>) => {
    applyOfficialAttachmentFiles(event, {
      canUploadOfficialAttachments,
      currentUser,
      selectedWorkOrder,
      setWorkOrders,
      setSaveStatus,
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    deleteWorkOrderAttachment({
      attachmentId,
      attachmentPreviewId,
      currentUser,
      selectedWorkOrder,
      isReviewRequestLocked,
      setAttachmentPreviewId,
      setWorkOrders,
      setSaveStatus,
      setHistoryLogs,
    });
  };

  const handleCreateMemoThread = (content: string, payload?: MemoAttachmentPayload) => {
    const { trimmed, selectedAttachmentIds, memoAttachments } = createMemoThread({
      content,
      currentUser,
      selectedWorkOrder,
      attachmentPayload: payload,
      setWorkOrders,
      setSaveStatus,
      setHistoryLogs,
    });
    if (!trimmed) return;
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
    setToastMessage(
      memoAttachments.length > 0 || selectedAttachmentIds.length > 0
        ? "첨부가 포함된 작업 메모가 등록되었습니다."
        : "작업 메모가 등록되었습니다.",
    );
  };

  const handleCreateMemoReply = (threadId: string, content: string, payload?: MemoAttachmentPayload) => {
    const { trimmed, selectedAttachmentIds, memoAttachments } = createMemoReply({
      threadId,
      content,
      currentUser,
      selectedWorkOrder,
      attachmentPayload: payload,
      setWorkOrders,
      setSaveStatus,
      setHistoryLogs,
    });
    if (!trimmed) return;
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

  const canDeleteAttachment = (attachment: Attachment | null) =>
    canDeleteAttachmentForCurrentUser({ currentUser, attachment, isReviewRequestLocked });

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

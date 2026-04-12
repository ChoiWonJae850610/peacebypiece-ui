"use client";

import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from "react";
import {
  buildAttachmentDeleteResult,
  buildMemoReplyResult,
  buildMemoThreadResult,
  buildOfficialAttachmentUploadResult,
  buildPromoteMemoAttachmentResult,
} from "@/lib/workorder/actionFlow";
import { canDeleteAttachmentForCurrentUser, openOfficialAttachmentPicker } from "@/lib/workorder/attachments/attachmentActions";
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
    if (!canUploadOfficialAttachments) {
      event.target.value = "";
      return;
    }

    const files = Array.from<File>(event.target.files ?? []);
    const result = buildOfficialAttachmentUploadResult({
      workOrder: selectedWorkOrder,
      currentUser,
      files,
    });
    event.target.value = "";
    if (!result) return;

    setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? result.nextWorkOrder : item)));
    if (result.historyLogs?.length) {
      setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
    }
    if (result.saveStatus) {
      setSaveStatus(result.saveStatus);
    }
    if (result.toastMessage) {
      setToastMessage(result.toastMessage);
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId) ?? null;
    if (!canDeleteAttachmentForCurrentUser({ currentUser, attachment: targetAttachment, isReviewRequestLocked })) {
      return;
    }

    const result = buildAttachmentDeleteResult({
      workOrder: selectedWorkOrder,
      currentUser,
      attachmentId,
      attachmentPreviewId,
    });
    if (!result) return;

    setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? result.nextWorkOrder : item)));
    if (result.resetAttachmentPreview) {
      setAttachmentPreviewId(null);
    }
    if (result.historyLogs?.length) {
      setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
    }
    if (result.saveStatus) {
      setSaveStatus(result.saveStatus);
    }
  };

  const handleCreateMemoThread = (content: string, payload?: MemoAttachmentPayload) => {
    const result = buildMemoThreadResult({
      workOrder: selectedWorkOrder,
      currentUser,
      content,
      attachmentPayload: payload,
    });
    if (!result) return;

    setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? result.nextWorkOrder : item)));
    if (result.historyLogs?.length) {
      setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
    }
    if (result.saveStatus) {
      setSaveStatus(result.saveStatus);
    }
    if (result.toastMessage) {
      setToastMessage(result.toastMessage);
    }
  };

  const handleCreateMemoReply = (threadId: string, content: string, payload?: MemoAttachmentPayload) => {
    const result = buildMemoReplyResult({
      workOrder: selectedWorkOrder,
      currentUser,
      threadId,
      content,
      attachmentPayload: payload,
    });
    if (!result) return;

    setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? result.nextWorkOrder : item)));
    if (result.historyLogs?.length) {
      setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
    }
    if (result.saveStatus) {
      setSaveStatus(result.saveStatus);
    }
    if (result.toastMessage) {
      setToastMessage(result.toastMessage);
    }
  };

  const handlePromoteMemoAttachment = (attachmentId: string) => {
    if (!canUploadOfficialAttachments || isReviewRequestLocked) return;

    const result = buildPromoteMemoAttachmentResult({
      workOrder: selectedWorkOrder,
      attachmentId,
      currentUser,
    });
    if (!result) return;

    setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? result.nextWorkOrder : item)));
    if (result.historyLogs?.length) {
      setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
    }
    if (result.saveStatus) {
      setSaveStatus(result.saveStatus);
    }
    if (result.toastMessage) {
      setToastMessage(result.toastMessage);
    }
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

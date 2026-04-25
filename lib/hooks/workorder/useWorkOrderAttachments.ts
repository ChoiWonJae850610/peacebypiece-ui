"use client";

import { useState, type ChangeEvent, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useI18n } from "@/lib/i18n";
import {
  buildAttachmentDeleteResult,
  buildMemoReplyResult,
  buildMemoThreadResult,
  buildPersistedAttachmentUploadResult,
} from "@/lib/workorder/actionFlow";
import {
  canDeleteAttachmentForCurrentUser,
  getAttachmentPermissionsForCurrentUser,
  clearAttachmentInputValue,
  openAttachmentPickerTrigger,
  readAttachmentInputFiles,
} from "@/lib/workorder/attachments/attachmentActions";
import { uploadWorkOrderAttachmentFiles } from "@/lib/workorder/attachments/attachmentUploadApiClient";
import type { Attachment, AttachmentScope, HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export function useWorkOrderAttachments({
  attachmentInputRef,
  canEditSideDraftContent,
  canUploadOfficialAttachments,
  canSeeAttachments,
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
  canEditSideDraftContent: boolean;
  canUploadOfficialAttachments: boolean;
  canSeeAttachments: boolean;
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
  const { i18n } = useI18n();
  const [attachmentPickerScope, setAttachmentPickerScope] = useState<AttachmentScope>("attachment");
  const actionFlowText = i18n.workorder.actionFlow;
  const historyText = i18n.workorder.history;

  const canUploadAttachmentScope = (_scope: AttachmentScope) => canEditSideDraftContent && canUploadOfficialAttachments;

  const handleOpenAttachmentPicker = (scope: AttachmentScope = "attachment") => {
    if (!canUploadAttachmentScope(scope)) return;
    setAttachmentPickerScope(scope);
    openAttachmentPickerTrigger(attachmentInputRef, true);
  };

  const handleAttachmentFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const scope = attachmentPickerScope === "design" ? "design" : "attachment";
    if (!canUploadAttachmentScope(scope)) {
      clearAttachmentInputValue(event);
      return;
    }

    const files = readAttachmentInputFiles(event);
    clearAttachmentInputValue(event);
    if (files.length === 0) return;

    setSaveStatus("saving");
    const uploadResult = await uploadWorkOrderAttachmentFiles({
      workOrder: selectedWorkOrder,
      currentUser,
      files,
      scope,
    });

    if (uploadResult.error || uploadResult.attachments.length === 0) {
      setSaveStatus("dirty");
      setToastMessage(uploadResult.message ?? uploadResult.error ?? "첨부파일 업로드에 실패했습니다.");
      return;
    }

    const result = buildPersistedAttachmentUploadResult({
      workOrder: selectedWorkOrder,
      currentUser,
      attachments: uploadResult.attachments,
      scope,
      text: actionFlowText as typeof actionFlowText & { designAttachmentUploadedToast?: string },
      historyText,
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

  const handleDeleteAttachment = (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId) ?? null;
    if (!canDeleteAttachmentForCurrentUser({
      currentUser,
      attachment: targetAttachment,
      canSeeAttachments,
      canManageAttachments: canUploadOfficialAttachments,
      isReviewRequestLocked: !canEditSideDraftContent,
    })) {
      return;
    }

    const result = buildAttachmentDeleteResult({
      workOrder: selectedWorkOrder,
      currentUser,
      attachmentId,
      attachmentPreviewId,
      historyText,
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

  const handleCreateMemoThread = (content: string) => {
    if (!canEditSideDraftContent) return;
    const result = buildMemoThreadResult({
      workOrder: selectedWorkOrder,
      currentUser,
      content,
      text: actionFlowText,
      historyText,
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

  const handleCreateMemoReply = (threadId: string, content: string) => {
    if (!canEditSideDraftContent) return;
    const result = buildMemoReplyResult({
      workOrder: selectedWorkOrder,
      currentUser,
      threadId,
      content,
      text: actionFlowText,
      historyText,
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

  const canMutateMemoItem = (authorId: string) => {
    const isAdmin = currentUser.role === "admin" || currentUser.roles?.includes("admin");
    return canEditSideDraftContent && (isAdmin || authorId === currentUser.id);
  };

  const handleUpdateMemoThread = (threadId: string, content: string) => {
    const nextContent = content.trim();
    const targetThread = (selectedWorkOrder.memoThreads ?? []).find((thread) => thread.id === threadId);
    if (!targetThread || targetThread.deletedAt || !nextContent || !canMutateMemoItem(targetThread.authorId)) return;

    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
      ? { ...item, memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId ? { ...thread, content: nextContent } : thread) }
      : item));
    setSaveStatus("dirty");
  };

  const handleDeleteMemoThread = (threadId: string) => {
    const targetThread = (selectedWorkOrder.memoThreads ?? []).find((thread) => thread.id === threadId);
    if (!targetThread || targetThread.deletedAt || !canMutateMemoItem(targetThread.authorId)) return;

    const deletedAt = new Date().toISOString();
    const hasVisibleReplies = (targetThread.replies ?? []).some((reply) => reply.isVisible !== false);
    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
      ? {
          ...item,
          memoThreads: (item.memoThreads ?? []).map((thread) => {
            if (thread.id !== threadId) return thread;
            return {
              ...thread,
              attachmentIds: [],
              deletedAt,
              isVisible: hasVisibleReplies,
            };
          }),
        }
      : item));
    setSaveStatus("dirty");
  };

  const handleUpdateMemoReply = (threadId: string, replyId: string, content: string) => {
    const nextContent = content.trim();
    const targetThread = (selectedWorkOrder.memoThreads ?? []).find((thread) => thread.id === threadId);
    const targetReply = targetThread?.replies?.find((reply) => reply.id === replyId);
    if (!targetReply || !nextContent || !canMutateMemoItem(targetReply.authorId)) return;

    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
      ? {
          ...item,
          memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId
            ? { ...thread, replies: (thread.replies ?? []).map((reply) => reply.id === replyId ? { ...reply, content: nextContent } : reply) }
            : thread),
        }
      : item));
    setSaveStatus("dirty");
  };

  const handleDeleteMemoReply = (threadId: string, replyId: string) => {
    const targetThread = (selectedWorkOrder.memoThreads ?? []).find((thread) => thread.id === threadId);
    const targetReply = targetThread?.replies?.find((reply) => reply.id === replyId);
    if (!targetReply || targetReply.deletedAt || !canMutateMemoItem(targetReply.authorId)) return;

    const deletedAt = new Date().toISOString();
    setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
      ? {
          ...item,
          memoThreads: (item.memoThreads ?? []).map((thread) => {
            if (thread.id !== threadId) return thread;

            const nextReplies = (thread.replies ?? []).map((reply) => reply.id === replyId
              ? { ...reply, attachmentIds: [], deletedAt, isVisible: false }
              : reply);
            const hasVisibleReplies = nextReplies.some((reply) => reply.isVisible !== false);
            const shouldHideDeletedThread = Boolean(thread.deletedAt) && !hasVisibleReplies;

            return {
              ...thread,
              isVisible: shouldHideDeletedThread ? false : thread.isVisible,
              replies: nextReplies,
            };
          }),
        }
      : item));
    setSaveStatus("dirty");
  };

  const canDeleteAttachment = (attachment: Attachment | null) =>
    canDeleteAttachmentForCurrentUser({
      currentUser,
      attachment,
      canSeeAttachments,
      canManageAttachments: canUploadOfficialAttachments,
      isReviewRequestLocked: !canEditSideDraftContent,
    });

  const getAttachmentPermissions = (attachment: Attachment | null) =>
    getAttachmentPermissionsForCurrentUser({
      currentUser,
      attachment,
      canSeeAttachments,
      canManageAttachments: canUploadOfficialAttachments,
      isReviewRequestLocked: !canEditSideDraftContent,
    });

  return {
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleDeleteAttachment,
    handleCreateMemoThread,
    handleCreateMemoReply,
    handleUpdateMemoThread,
    handleDeleteMemoThread,
    handleUpdateMemoReply,
    handleDeleteMemoReply,
    canDeleteAttachment,
    getAttachmentPermissions,
  };
}

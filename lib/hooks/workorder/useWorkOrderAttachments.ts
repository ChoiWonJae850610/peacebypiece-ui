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
import { deleteWorkOrderAttachmentInDb } from "@/lib/workorder/attachments/attachmentDeleteApiClient";
import { setPrimaryDesignAttachmentInDb } from "@/lib/workorder/attachments/attachmentPrimaryApiClient";
import { uploadWorkOrderAttachmentFiles } from "@/lib/workorder/attachments/attachmentUploadApiClient";
import { WORK_ORDER_ATTACHMENT_POLICY } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import { createMemoReplyInDb, createMemoThreadInDb, deleteMemoInDb, updateMemoInDb } from "@/lib/workorder/memo/memoApiClient";
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

  const handleOpenAttachmentPicker = (scope: AttachmentScope = "attachment") => {
    setAttachmentPickerScope(scope);
    openAttachmentPickerTrigger(attachmentInputRef, canEditSideDraftContent && canUploadOfficialAttachments);
  };

  const handleAttachmentFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!canEditSideDraftContent || !canUploadOfficialAttachments) {
      clearAttachmentInputValue(event);
      return;
    }

    const files = readAttachmentInputFiles(event);
    const scope = attachmentPickerScope === "design" ? "design" : "attachment";
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

  const handleDeleteAttachment = async (attachmentId: string) => {
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

    setSaveStatus("saving");

    try {
      await deleteWorkOrderAttachmentInDb({
        attachmentId,
        deletedBy: currentUser.name,
        deleteReason: targetAttachment?.scope === "design" ? "작지 디자인 삭제" : "작지 첨부 삭제",
      });
      const result = buildAttachmentDeleteResult({
        workOrder: selectedWorkOrder,
        currentUser,
        attachmentId,
        attachmentPreviewId,
        historyText,
      });
      if (!result) {
        setSaveStatus("saved");
        return;
      }

      setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? result.nextWorkOrder : item)));
      if (result.resetAttachmentPreview) {
        setAttachmentPreviewId(null);
      }
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      setSaveStatus("saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "첨부파일 삭제에 실패했습니다.";
      setSaveStatus("dirty");
      setToastMessage(message);
    }
  };
  const handleCreateMemoThread = async (content: string) => {
    if (!canEditSideDraftContent) return;
    setSaveStatus("saving");

    try {
      const createdThread = await createMemoThreadInDb({
        workOrder: selectedWorkOrder,
        currentUser,
        content,
      });
      const result = buildMemoThreadResult({
        workOrder: selectedWorkOrder,
        currentUser,
        content: createdThread.content,
        text: actionFlowText,
        historyText,
      });
      if (!result) {
        setSaveStatus("saved");
        return;
      }

      const nextWorkOrder = {
        ...result.nextWorkOrder,
        memoThreads: (result.nextWorkOrder.memoThreads ?? []).map((thread) =>
          thread.content === createdThread.content && thread.authorId === createdThread.authorId
            ? { ...createdThread, replies: createdThread.replies ?? [] }
            : thread,
        ),
      };

      setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? nextWorkOrder : item)));
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      setSaveStatus("saved");
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "메모 저장에 실패했습니다.";
      setSaveStatus("dirty");
      setToastMessage(message);
    }
  };

  const handleCreateMemoReply = async (threadId: string, content: string) => {
    if (!canEditSideDraftContent) return;
    setSaveStatus("saving");

    try {
      const createdReply = await createMemoReplyInDb({
        workOrder: selectedWorkOrder,
        currentUser,
        threadId,
        content,
      });
      const result = buildMemoReplyResult({
        workOrder: selectedWorkOrder,
        currentUser,
        threadId,
        content: createdReply.content,
        text: actionFlowText,
        historyText,
      });
      if (!result) {
        setSaveStatus("saved");
        return;
      }

      const nextWorkOrder = {
        ...result.nextWorkOrder,
        memoThreads: (result.nextWorkOrder.memoThreads ?? []).map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                replies: (thread.replies ?? []).map((reply) =>
                  reply.content === createdReply.content && reply.authorId === createdReply.authorId ? createdReply : reply,
                ),
              }
            : thread,
        ),
      };

      setWorkOrders((prev) => prev.map((item) => (item.id === selectedWorkOrder.id ? nextWorkOrder : item)));
      if (result.historyLogs?.length) {
        setHistoryLogs((prev) => [...result.historyLogs!, ...prev]);
      }
      setSaveStatus("saved");
      if (result.toastMessage) {
        setToastMessage(result.toastMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "댓글 저장에 실패했습니다.";
      setSaveStatus("dirty");
      setToastMessage(message);
    }
  };

  const canMutateMemoItem = (authorId: string) => {
    const isAdmin = currentUser.role === "admin" || currentUser.roles?.includes("admin");
    return canEditSideDraftContent && (isAdmin || authorId === currentUser.id);
  };

  const handleUpdateMemoThread = async (threadId: string, content: string) => {
    const nextContent = content.trim();
    const targetThread = (selectedWorkOrder.memoThreads ?? []).find((thread) => thread.id === threadId);
    if (!targetThread || targetThread.deletedAt || !nextContent || !canMutateMemoItem(targetThread.authorId)) return;

    setSaveStatus("saving");
    try {
      await updateMemoInDb({ memoId: threadId, content: nextContent });
      setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
        ? { ...item, memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId ? { ...thread, content: nextContent } : thread) }
        : item));
      setSaveStatus("saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "메모 수정에 실패했습니다.";
      setSaveStatus("dirty");
      setToastMessage(message);
    }
  };

  const handleDeleteMemoThread = async (threadId: string) => {
    const targetThread = (selectedWorkOrder.memoThreads ?? []).find((thread) => thread.id === threadId);
    if (!targetThread || targetThread.deletedAt || !canMutateMemoItem(targetThread.authorId)) return;

    setSaveStatus("saving");
    try {
      await deleteMemoInDb({ memoId: threadId, target: "thread" });
      const deletedAt = new Date().toISOString();
      const hasVisibleReplies = (targetThread.replies ?? []).some((reply) => reply.isVisible !== false && !reply.deletedAt);
      setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
        ? {
            ...item,
            memoThreads: (item.memoThreads ?? []).map((thread) => {
              if (thread.id !== threadId) return thread;
              return {
                ...thread,
                content: hasVisibleReplies ? "삭제된 메모입니다." : thread.content,
                attachmentIds: [],
                deletedAt,
                isVisible: hasVisibleReplies,
              };
            }),
          }
        : item));
      setSaveStatus("saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "메모 삭제에 실패했습니다.";
      setSaveStatus("dirty");
      setToastMessage(message);
    }
  };

  const handleUpdateMemoReply = async (threadId: string, replyId: string, content: string) => {
    const nextContent = content.trim();
    const targetThread = (selectedWorkOrder.memoThreads ?? []).find((thread) => thread.id === threadId);
    const targetReply = targetThread?.replies?.find((reply) => reply.id === replyId);
    if (!targetReply || !nextContent || !canMutateMemoItem(targetReply.authorId)) return;

    setSaveStatus("saving");
    try {
      await updateMemoInDb({ memoId: replyId, content: nextContent });
      setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
        ? {
            ...item,
            memoThreads: (item.memoThreads ?? []).map((thread) => thread.id === threadId
              ? { ...thread, replies: (thread.replies ?? []).map((reply) => reply.id === replyId ? { ...reply, content: nextContent } : reply) }
              : thread),
          }
        : item));
      setSaveStatus("saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "댓글 수정에 실패했습니다.";
      setSaveStatus("dirty");
      setToastMessage(message);
    }
  };

  const handleDeleteMemoReply = async (threadId: string, replyId: string) => {
    const targetThread = (selectedWorkOrder.memoThreads ?? []).find((thread) => thread.id === threadId);
    const targetReply = targetThread?.replies?.find((reply) => reply.id === replyId);
    if (!targetReply || targetReply.deletedAt || !canMutateMemoItem(targetReply.authorId)) return;

    setSaveStatus("saving");
    try {
      await deleteMemoInDb({ memoId: replyId, target: "reply" });
      const deletedAt = new Date().toISOString();
      setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
        ? {
            ...item,
            memoThreads: (item.memoThreads ?? []).map((thread) => {
              if (thread.id !== threadId) return thread;

              const nextReplies = (thread.replies ?? [])
                .map((reply) => reply.id === replyId
                  ? { ...reply, attachmentIds: [], deletedAt, isVisible: false }
                  : reply)
                .filter((reply) => reply.isVisible !== false && !reply.deletedAt);
              const hasVisibleReplies = nextReplies.length > 0;
              const shouldHideDeletedThread = Boolean(thread.deletedAt) && !hasVisibleReplies;

              return {
                ...thread,
                isVisible: shouldHideDeletedThread ? false : thread.isVisible,
                replies: nextReplies,
              };
            }),
          }
        : item));
      setSaveStatus("saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "댓글 삭제에 실패했습니다.";
      setSaveStatus("dirty");
      setToastMessage(message);
    }
  };


  const handleSetPrimaryDesignAttachment = async (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId) ?? null;
    if (!targetAttachment || targetAttachment.scope !== "design" || targetAttachment.type !== "image") return;
    if (!canEditSideDraftContent || !canUploadOfficialAttachments) return;

    setSaveStatus("saving");
    try {
      await setPrimaryDesignAttachmentInDb({ workOrderId: selectedWorkOrder.id, attachmentId });
      setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
        ? {
            ...item,
            attachments: (item.attachments ?? []).map((attachment) => attachment.scope === "design"
              ? { ...attachment, isPrimary: attachment.id === attachmentId }
              : attachment),
          }
        : item));
      setSaveStatus("saved");
      setToastMessage(WORK_ORDER_ATTACHMENT_POLICY.messages.primarySetToast);
    } catch (error) {
      const message = error instanceof Error ? error.message : WORK_ORDER_ATTACHMENT_POLICY.messages.primarySetFailed;
      setSaveStatus("dirty");
      setToastMessage(message);
    }
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
    handleSetPrimaryDesignAttachment,
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

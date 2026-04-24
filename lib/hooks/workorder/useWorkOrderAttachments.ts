"use client";

import { useState, type ChangeEvent, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useI18n } from "@/lib/i18n";
import {
  buildAttachmentDeleteResult,
  buildMemoReplyResult,
  buildMemoThreadResult,
  buildAttachmentUploadResult,
} from "@/lib/workorder/actionFlow";
import {
  canDeleteAttachmentForCurrentUser,
  getAttachmentPermissionsForCurrentUser,
  clearAttachmentInputValue,
  openAttachmentPickerTrigger,
  readAttachmentInputFiles,
} from "@/lib/workorder/attachments/attachmentActions";
import type { Attachment, AttachmentScope, HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

export function useWorkOrderAttachments({
  attachmentInputRef,
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
  const [attachmentPickerScope, setAttachmentPickerScope] = useState<AttachmentScope>("official");
  const actionFlowText = i18n.workorder.actionFlow;
  const historyText = i18n.workorder.history;

  const handleOpenAttachmentPicker = (scope: AttachmentScope = "official") => {
    setAttachmentPickerScope(scope);
    openAttachmentPickerTrigger(attachmentInputRef, canUploadOfficialAttachments);
  };

  const handleAttachmentFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canUploadOfficialAttachments) {
      clearAttachmentInputValue(event);
      return;
    }

    const files = readAttachmentInputFiles(event);
    const result = buildAttachmentUploadResult({
      workOrder: selectedWorkOrder,
      currentUser,
      files,
      scope: attachmentPickerScope === "design" ? "design" : "official",
      text: actionFlowText as typeof actionFlowText & { designAttachmentUploadedToast?: string },
      historyText,
    });
    clearAttachmentInputValue(event);
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
      isReviewRequestLocked,
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

  const canDeleteAttachment = (attachment: Attachment | null) =>
    canDeleteAttachmentForCurrentUser({
      currentUser,
      attachment,
      canSeeAttachments,
      canManageAttachments: canUploadOfficialAttachments,
      isReviewRequestLocked,
    });

  const getAttachmentPermissions = (attachment: Attachment | null) =>
    getAttachmentPermissionsForCurrentUser({
      currentUser,
      attachment,
      canSeeAttachments,
      canManageAttachments: canUploadOfficialAttachments,
      isReviewRequestLocked,
    });

  return {
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleDeleteAttachment,
    handleCreateMemoThread,
    handleCreateMemoReply,
    canDeleteAttachment,
    getAttachmentPermissions,
  };
}

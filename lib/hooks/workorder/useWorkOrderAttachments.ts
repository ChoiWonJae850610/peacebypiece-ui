"use client";

import { useState, type ChangeEvent, type Dispatch, type RefObject, type SetStateAction } from "react";
import { useI18n } from "@/lib/i18n";
import { ATTACHMENT_SCOPE, isDesignAttachmentScope, normalizeUploadableAttachmentScopeValue, type UploadableAttachmentScopeValue } from "@/lib/constants/workorderIdentity";
import {
  buildAttachmentDeleteResult,
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
import { getAttachmentInputAccept, WORK_ORDER_ATTACHMENT_POLICY } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import type { Attachment, AttachmentScope, HistoryLog, UserProfile, WorkOrder } from "@/types/workorder";

type UploadableAttachmentScope = UploadableAttachmentScopeValue;

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
  const [attachmentPickerScope, setAttachmentPickerScope] = useState<AttachmentScope>(ATTACHMENT_SCOPE.attachment);
  const actionFlowText = i18n.workorder.actionFlow;
  const historyText = i18n.workorder.history;

  const handleOpenAttachmentPicker = (scope: AttachmentScope = ATTACHMENT_SCOPE.attachment) => {
    const normalizedScope = normalizeUploadableAttachmentScopeValue(scope, ATTACHMENT_SCOPE.attachment);
    setAttachmentPickerScope(normalizedScope);
    openAttachmentPickerTrigger(
      attachmentInputRef,
      canEditSideDraftContent && canUploadOfficialAttachments,
      getAttachmentInputAccept(normalizedScope),
    );
  };

  const uploadAttachmentFileList = async (files: File[], scope: UploadableAttachmentScope) => {
    if (!canEditSideDraftContent || !canUploadOfficialAttachments) return;
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

    let persistedAttachments = uploadResult.attachments;
    const shouldSetFirstDesignAsPrimary = isDesignAttachmentScope(scope)
      && !(selectedWorkOrder.attachments ?? []).some((attachment) => isDesignAttachmentScope(attachment.scope) && attachment.type === "image" && attachment.isPrimary === true);
    const firstUploadedDesignImage = shouldSetFirstDesignAsPrimary
      ? persistedAttachments.find((attachment) => isDesignAttachmentScope(attachment.scope) && attachment.type === "image") ?? null
      : null;

    if (firstUploadedDesignImage) {
      try {
        await setPrimaryDesignAttachmentInDb({ workOrderId: selectedWorkOrder.id, attachmentId: firstUploadedDesignImage.id });
        persistedAttachments = persistedAttachments.map((attachment) => isDesignAttachmentScope(attachment.scope)
          ? { ...attachment, isPrimary: attachment.id === firstUploadedDesignImage.id }
          : attachment);
      } catch (error) {
        console.warn("[PRIMARY_DESIGN_AUTO_SET_FAILED]", error);
      }
    }

    const result = buildPersistedAttachmentUploadResult({
      workOrder: selectedWorkOrder,
      currentUser,
      attachments: persistedAttachments,
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

  const handleAttachmentFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!canEditSideDraftContent || !canUploadOfficialAttachments) {
      clearAttachmentInputValue(event);
      return;
    }

    const files = readAttachmentInputFiles(event);
    const scope = normalizeUploadableAttachmentScopeValue(attachmentPickerScope, ATTACHMENT_SCOPE.attachment);
    clearAttachmentInputValue(event);
    await uploadAttachmentFileList(files, scope);
  };

  const handleAttachmentFileDrop = async (scope: UploadableAttachmentScope, files: File[]) => {
    await uploadAttachmentFileList(files, scope);
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
      });

      const nextPrimaryDesignAttachment = targetAttachment && isDesignAttachmentScope(targetAttachment.scope) && targetAttachment.type === "image" && targetAttachment.isPrimary === true
        ? (selectedWorkOrder.attachments ?? []).find((attachment) => attachment.id !== attachmentId && isDesignAttachmentScope(attachment.scope) && attachment.type === "image") ?? null
        : null;

      if (nextPrimaryDesignAttachment) {
        try {
          await setPrimaryDesignAttachmentInDb({ workOrderId: selectedWorkOrder.id, attachmentId: nextPrimaryDesignAttachment.id });
        } catch (error) {
          console.warn("[PRIMARY_DESIGN_AUTO_REASSIGN_FAILED]", error);
        }
      }

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

      setWorkOrders((prev) => prev.map((item) => {
        if (item.id !== selectedWorkOrder.id) return item;
        if (!nextPrimaryDesignAttachment) return result.nextWorkOrder;

        return {
          ...result.nextWorkOrder,
          attachments: (result.nextWorkOrder.attachments ?? []).map((attachment) => isDesignAttachmentScope(attachment.scope)
            ? { ...attachment, isPrimary: attachment.id === nextPrimaryDesignAttachment.id }
            : attachment),
        };
      }));
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
  const handleSetPrimaryDesignAttachment = async (attachmentId: string) => {
    const targetAttachment = selectedWorkOrder.attachments.find((item) => item.id === attachmentId) ?? null;
    if (!targetAttachment || !isDesignAttachmentScope(targetAttachment.scope) || targetAttachment.type !== "image") return;
    if (!canEditSideDraftContent || !canUploadOfficialAttachments) return;

    setSaveStatus("saving");
    try {
      await setPrimaryDesignAttachmentInDb({ workOrderId: selectedWorkOrder.id, attachmentId });
      setWorkOrders((prev) => prev.map((item) => item.id === selectedWorkOrder.id
        ? {
            ...item,
            attachments: (item.attachments ?? []).map((attachment) => isDesignAttachmentScope(attachment.scope)
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
    attachmentInputAccept: getAttachmentInputAccept(normalizeUploadableAttachmentScopeValue(attachmentPickerScope, ATTACHMENT_SCOPE.attachment)),
    handleOpenAttachmentPicker,
    handleAttachmentFiles,
    handleAttachmentFileDrop,
    handleDeleteAttachment,
    handleSetPrimaryDesignAttachment,
    canDeleteAttachment,
    getAttachmentPermissions,
  };
}

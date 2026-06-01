import type { ChangeEventHandler, ComponentProps, RefObject } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import AttachmentDeleteConfirmModal from "@/components/common/modal/AttachmentDeleteConfirmModal";
import AttachmentPreviewModal from "@/components/common/modal/AttachmentPreviewModal";
import CreateWorkOrderModal from "@/components/common/modal/CreateWorkOrderModal";
import InventoryEditor from "@/components/common/modal/InventoryEditor";
import InventoryLogModal from "@/components/common/modal/InventoryLogModal";
import ManagerAssignModal from "@/components/common/modal/ManagerAssignModal";
import OrderRequestConfirmModal from "@/components/common/modal/OrderRequestConfirmModal";
import RejectReviewReasonModal from "@/components/common/modal/RejectReviewReasonModal";
import WorkflowValidationModal from "@/components/common/modal/WorkflowValidationModal";
import PermissionModal from "@/components/common/modal/PermissionModal";

type WorkOrderOverlayProps = {
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  attachmentInputAccept: string;
  onAttachmentFilesChange: ChangeEventHandler<HTMLInputElement>;
  writeLocked?: boolean;
  writeLockMessage?: string;
  toastMessage: ComponentProps<typeof ToastMessage>["message"];
  modalProps: {
    orderRequestConfirm: ComponentProps<typeof OrderRequestConfirmModal>;
    attachmentPreview: ComponentProps<typeof AttachmentPreviewModal>;
    attachmentDeleteConfirm: ComponentProps<typeof AttachmentDeleteConfirmModal>;
    inventoryLog: ComponentProps<typeof InventoryLogModal>;
    managerAssign: ComponentProps<typeof ManagerAssignModal>;
    inventoryEditor: ComponentProps<typeof InventoryEditor>;
    createWorkOrder: ComponentProps<typeof CreateWorkOrderModal>;
    permission: ComponentProps<typeof PermissionModal>;
    workflowValidation: ComponentProps<typeof WorkflowValidationModal>;
    rejectReviewReason: ComponentProps<typeof RejectReviewReasonModal>;
  };
};

export default function WorkOrderOverlay({
  attachmentInputRef,
  attachmentInputAccept,
  onAttachmentFilesChange,
  toastMessage,
  modalProps,
  writeLocked = false,
  writeLockMessage,
}: WorkOrderOverlayProps) {
  return (
    <>
      <WorkflowValidationModal {...modalProps.workflowValidation} />
      <RejectReviewReasonModal {...modalProps.rejectReviewReason} />
      <OrderRequestConfirmModal {...modalProps.orderRequestConfirm} />
      <AttachmentPreviewModal {...modalProps.attachmentPreview} />
      <AttachmentDeleteConfirmModal {...modalProps.attachmentDeleteConfirm} />
      <InventoryLogModal {...modalProps.inventoryLog} />
      <ManagerAssignModal {...modalProps.managerAssign} />
      <InventoryEditor {...modalProps.inventoryEditor} />
      <CreateWorkOrderModal {...modalProps.createWorkOrder} />
      <PermissionModal {...modalProps.permission} />

      <input
        ref={attachmentInputRef}
        type="file"
        accept={attachmentInputAccept}
        multiple
        className="sr-only"
        onChange={onAttachmentFilesChange}
        disabled={writeLocked}
      />
      {writeLocked && writeLockMessage ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1.75rem+env(safe-area-inset-bottom))] z-[70] flex justify-center px-4 md:bottom-7 md:justify-center md:px-8">
          <div className="pbp-toast pbp-toast--floating pbp-toast--processing" data-tone="loading" role="status" aria-live="polite">
            <span className="pbp-toast__spinner" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-left"><span className="block text-[11px] font-bold leading-4 tracking-[0.12em] pbp-toast__eyebrow">처리중</span><span className="mt-0.5 block text-sm font-semibold leading-5 pbp-toast__message">{writeLockMessage}</span></span>
          </div>
        </div>
      ) : null}
      <ToastMessage message={toastMessage} />
    </>
  );
}

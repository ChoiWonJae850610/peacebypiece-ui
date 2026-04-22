import type { ChangeEventHandler, ComponentProps, RefObject } from "react";
import ToastMessage from "@/components/common/ToastMessage";
import { ATTACHMENT_INPUT_ACCEPT } from "@/lib/permissions/attachments";
import AttachmentDeleteConfirmModal from "@/components/common/modal/AttachmentDeleteConfirmModal";
import AttachmentPreviewModal from "@/components/common/modal/AttachmentPreviewModal";
import CreateWorkOrderModal from "@/components/common/modal/CreateWorkOrderModal";
import InventoryEditor from "@/components/common/modal/InventoryEditor";
import InventoryLogModal from "@/components/common/modal/InventoryLogModal";
import ManagerAssignModal from "@/components/common/modal/ManagerAssignModal";
import OrderRequestConfirmModal from "@/components/common/modal/OrderRequestConfirmModal";
import PermissionModal from "@/components/common/modal/PermissionModal";

type WorkOrderOverlayProps = {
  attachmentInputRef: RefObject<HTMLInputElement | null>;
  onAttachmentFilesChange: ChangeEventHandler<HTMLInputElement>;
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
  };
};

export default function WorkOrderOverlay({
  attachmentInputRef,
  onAttachmentFilesChange,
  toastMessage,
  modalProps,
}: WorkOrderOverlayProps) {
  return (
    <>
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
        accept={ATTACHMENT_INPUT_ACCEPT}
        multiple
        className="sr-only"
        onChange={onAttachmentFilesChange}
      />
      <ToastMessage message={toastMessage} />
    </>
  );
}

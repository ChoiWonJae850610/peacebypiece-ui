"use client";

import { useEffect, useState } from "react";

import WorkOrderDrawingModal from "@/components/workorder/drawing/WorkOrderDrawingModal";
import {
  writeDesignDrawingModalOpenState,
} from "@/components/workorder/drawing/workOrderDrawingModalSession";
import WorkOrderFactoryInstructionPanel from "@/components/workorder/factoryInstruction/WorkOrderFactoryInstructionPanel";
import WorkOrderAttachmentPanel from "@/components/workorder/sidepanel/WorkOrderAttachmentPanel";
import type { WorkOrderSidePanelProps } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";
import { ATTACHMENT_SCOPE, isDesignAttachmentScope } from "@/lib/constants/workorderIdentity";

export type WorkOrderMobileRelatedSectionKey = "attachment" | "design" | "instruction";

type WorkOrderMobileRelatedSectionPanelsProps = WorkOrderSidePanelProps & {
  activeSection: WorkOrderMobileRelatedSectionKey;
};

export default function WorkOrderMobileRelatedSectionPanels({
  activeSection,
  ...props
}: WorkOrderMobileRelatedSectionPanelsProps) {
  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const hasDesignAttachmentSection = props.attachmentSections.some((section) => isDesignAttachmentScope(section.uploadScope));
  const canRenderDesignDrawingModal = !props.isEmpty && props.canSeeAttachments && hasDesignAttachmentSection;

  useEffect(() => {
    if (activeSection !== "design") {
      writeDesignDrawingModalOpenState(false);
      setDrawingModalOpen(false);
    }
  }, [activeSection]);

  const openDesignDrawingModal = () => {
    writeDesignDrawingModalOpenState(true);
    setDrawingModalOpen(true);
  };

  const closeDesignDrawingModal = () => {
    writeDesignDrawingModalOpenState(false);
    setDrawingModalOpen(false);
  };
  if (activeSection === "instruction") {
    return (
      <WorkOrderFactoryInstructionPanel
        workOrderId={props.factoryInstructionWorkOrderId}
        editable={props.canEditFactoryInstruction}
        lockMessage={props.factoryInstructionLockMessage}
      />
    );
  }

  const targetScope = activeSection === "design" ? ATTACHMENT_SCOPE.design : ATTACHMENT_SCOPE.attachment;
  const section = props.attachmentSections.find((item) => item.uploadScope === targetScope);

  if (!section) {
    return null;
  }

  const canOpenDesignDrawing = isDesignAttachmentScope(section.uploadScope);

  return (
    <>
      <WorkOrderAttachmentPanel
        title={section.title}
        emptyText={section.emptyText}
        addButtonLabel={section.addButtonLabel}
        canSeeAttachments={props.canSeeAttachments}
        canManageAttachments={props.canManageAttachments}
        attachments={section.items}
        uploadScope={section.uploadScope}
        onOpenAttachmentPicker={() => props.onOpenAttachmentPicker(section.uploadScope)}
        onOpenDesignDrawingModal={canOpenDesignDrawing ? openDesignDrawingModal : undefined}
        onUploadFiles={(files) => props.onUploadAttachmentFiles(section.uploadScope, files)}
        onPreviewAttachment={props.onPreviewAttachment}
        onDeleteAttachment={props.onDeleteAttachment}
        onSetPrimaryDesignAttachment={props.onSetPrimaryDesignAttachment}
        canGenerateOrderRequestPdf={props.canGenerateOrderRequestPdf}
        onGenerateOrderRequestPdf={props.onGenerateOrderRequestPdf}
        writeLocked={props.writeLocked}
        writeLockMessage={props.writeLockMessage}
        variant="mobile"
      />
      {canRenderDesignDrawingModal ? (
        <WorkOrderDrawingModal
          open={drawingModalOpen}
          onClose={closeDesignDrawingModal}
          onSaveDrawing={(file) => {
            closeDesignDrawingModal();
            props.onUploadAttachmentFiles(ATTACHMENT_SCOPE.design, [file]);
          }}
          variant="mobile"
        />
      ) : null}
    </>
  );
}

"use client";

import { useState } from "react";
import { ATTACHMENT_SCOPE, isDesignAttachmentScope } from "@/lib/constants/workorderIdentity";
import WorkOrderDrawingModal from "@/components/workorder/drawing/WorkOrderDrawingModal";
import {
  readDesignDrawingModalOpenState,
  writeDesignDrawingModalOpenState,
} from "@/components/workorder/drawing/workOrderDrawingModalSession";
import type { WorkOrderSidePanelProps, WorkOrderSidePanelVariant } from "@/components/workorder/sidepanel/WorkOrderSidePanel.types";
import WorkOrderSidePanelDesktopView from "@/components/workorder/sidepanel/views/WorkOrderSidePanelDesktopView";
import WorkOrderSidePanelMobileView from "@/components/workorder/sidepanel/views/WorkOrderSidePanelMobileView";
import WorkOrderSidePanelTabletView from "@/components/workorder/sidepanel/views/WorkOrderSidePanelTabletView";

type WorkOrderSidePanelContainerProps = WorkOrderSidePanelProps & {
  presentation: WorkOrderSidePanelVariant;
};

export default function WorkOrderSidePanelContainer(props: WorkOrderSidePanelContainerProps) {
  const deviceType = props.presentation;
  const [drawingModalOpen, setDrawingModalOpen] = useState(readDesignDrawingModalOpenState);
  const hasDesignAttachmentSection = props.attachmentSections.some((section) => isDesignAttachmentScope(section.uploadScope));
  const canRenderDesignDrawingModal = !props.isEmpty && props.canSeeAttachments && hasDesignAttachmentSection;

  const openDesignDrawingModal = () => {
    writeDesignDrawingModalOpenState(true);
    setDrawingModalOpen(true);
  };

  const closeDesignDrawingModal = () => {
    writeDesignDrawingModalOpenState(false);
    setDrawingModalOpen(false);
  };

  const { presentation: _presentation, ...workOrderSidePanelProps } = props;
  const sidePanelProps: WorkOrderSidePanelProps = {
    ...workOrderSidePanelProps,
    onOpenDesignDrawingModal: openDesignDrawingModal,
  };

  let sidePanelView = null;
  if (!props.isEmpty) {
    if (deviceType === "mobile") {
      sidePanelView = <WorkOrderSidePanelMobileView {...sidePanelProps} />;
    } else if (deviceType === "tablet") {
      sidePanelView = <WorkOrderSidePanelTabletView {...sidePanelProps} />;
    } else {
      sidePanelView = <WorkOrderSidePanelDesktopView {...sidePanelProps} />;
    }
  }

  return (
    <>
      {sidePanelView}
      {canRenderDesignDrawingModal ? (
        <WorkOrderDrawingModal
          open={drawingModalOpen}
          onClose={closeDesignDrawingModal}
          onSaveDrawing={(file) => {
            closeDesignDrawingModal();
            props.onUploadAttachmentFiles(ATTACHMENT_SCOPE.design, [file]);
          }}
          variant={deviceType}
        />
      ) : null}
    </>
  );
}

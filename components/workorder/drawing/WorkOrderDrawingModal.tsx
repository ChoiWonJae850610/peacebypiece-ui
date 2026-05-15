"use client";

import WorkOrderDrawingDesktopEditor from "./WorkOrderDrawingDesktopEditor";
import WorkOrderDrawingMobileEditor from "./WorkOrderDrawingMobileEditor";
import WorkOrderDrawingTabletEditor from "./WorkOrderDrawingTabletEditor";
import { type DrawingDeviceVariant } from "./drawingDevicePolicy";

export type WorkOrderDrawingModalProps = {
  open: boolean;
  onClose: () => void;
  onSaveDrawing: (file: File) => void;
  variant?: DrawingDeviceVariant;
};

export default function WorkOrderDrawingModal({
  open,
  onClose,
  onSaveDrawing,
  variant = "desktop",
}: WorkOrderDrawingModalProps) {
  if (variant === "tablet") {
    return <WorkOrderDrawingTabletEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
  }

  if (variant === "mobile") {
    return <WorkOrderDrawingMobileEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
  }

  return <WorkOrderDrawingDesktopEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
}

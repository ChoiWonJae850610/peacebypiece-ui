"use client";

import { useEffect, useRef, useState } from "react";
import WorkOrderDrawingDesktopEditor from "./WorkOrderDrawingDesktopEditor";
import WorkOrderDrawingIpadEditor from "./WorkOrderDrawingIpadEditor";
import WorkOrderDrawingMobileEditor from "./WorkOrderDrawingMobileEditor";
import WorkOrderDrawingTabletEditor from "./WorkOrderDrawingTabletEditor";
import { resolveRuntimeDrawingEditorVariant, type DrawingDeviceVariant, type DrawingRuntimeEditorVariant } from "./drawingDevicePolicy";

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
  const [drawingVariant, setDrawingVariant] = useState<DrawingRuntimeEditorVariant>(() => resolveRuntimeDrawingEditorVariant(variant));
  const previousOpenRef = useRef(open);

  useEffect(() => {
    const wasOpen = previousOpenRef.current;
    previousOpenRef.current = open;

    if (!open || wasOpen) return;
    setDrawingVariant(resolveRuntimeDrawingEditorVariant(variant));
  }, [open, variant]);

  if (drawingVariant === "ipad") {
    return <WorkOrderDrawingIpadEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
  }

  if (drawingVariant === "tablet") {
    return <WorkOrderDrawingTabletEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
  }

  if (drawingVariant === "mobile") {
    return <WorkOrderDrawingMobileEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
  }

  return <WorkOrderDrawingDesktopEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
}

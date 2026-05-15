"use client";

import { useEffect, useState } from "react";
import WorkOrderDrawingDesktopEditor from "./WorkOrderDrawingDesktopEditor";
import WorkOrderDrawingMobileEditor from "./WorkOrderDrawingMobileEditor";
import WorkOrderDrawingTabletEditor from "./WorkOrderDrawingTabletEditor";
import { resolveRuntimeDrawingDeviceVariant, type DrawingDeviceVariant } from "./drawingDevicePolicy";

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
  const [drawingVariant, setDrawingVariant] = useState<DrawingDeviceVariant>(() => resolveRuntimeDrawingDeviceVariant(variant));

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const syncDrawingVariant = () => {
      setDrawingVariant(resolveRuntimeDrawingDeviceVariant(variant));
    };

    syncDrawingVariant();
    window.addEventListener("resize", syncDrawingVariant);
    window.addEventListener("orientationchange", syncDrawingVariant);
    return () => {
      window.removeEventListener("resize", syncDrawingVariant);
      window.removeEventListener("orientationchange", syncDrawingVariant);
    };
  }, [open, variant]);

  if (drawingVariant === "tablet") {
    return <WorkOrderDrawingTabletEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
  }

  if (drawingVariant === "mobile") {
    return <WorkOrderDrawingMobileEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
  }

  return <WorkOrderDrawingDesktopEditor open={open} onClose={onClose} onSaveDrawing={onSaveDrawing} />;
}

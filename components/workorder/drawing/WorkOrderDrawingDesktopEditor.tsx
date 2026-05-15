"use client";

import WorkOrderDrawingCanvasEditor, { type WorkOrderDrawingEditorProps } from "./WorkOrderDrawingCanvasEditor";
import { DRAWING_DEVICE_POLICIES } from "./drawingDevicePolicy";

export default function WorkOrderDrawingDesktopEditor(props: WorkOrderDrawingEditorProps) {
  return <WorkOrderDrawingCanvasEditor {...props} devicePolicy={DRAWING_DEVICE_POLICIES.desktop} />;
}

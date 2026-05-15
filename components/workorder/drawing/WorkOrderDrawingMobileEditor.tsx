"use client";

import WorkOrderDrawingCanvasEditor, { type WorkOrderDrawingEditorProps } from "./WorkOrderDrawingCanvasEditor";
import { DRAWING_DEVICE_POLICIES } from "./drawingDevicePolicy";

export default function WorkOrderDrawingMobileEditor(props: WorkOrderDrawingEditorProps) {
  return <WorkOrderDrawingCanvasEditor {...props} devicePolicy={DRAWING_DEVICE_POLICIES.mobile} />;
}

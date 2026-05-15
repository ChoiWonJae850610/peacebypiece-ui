"use client";

import { useEffect } from "react";
import WorkOrderDrawingCanvasEditor, { type WorkOrderDrawingEditorProps } from "./WorkOrderDrawingCanvasEditor";
import { DRAWING_DEVICE_POLICIES } from "./drawingDevicePolicy";

const IPAD_VIEWPORT_HEIGHT_CSS_VAR = "--pbp-drawing-ipad-viewport-height";
const VIEWPORT_STABILIZATION_DELAYS = [0, 80, 180, 320] as const;

function getStableViewportHeight() {
  if (typeof window === "undefined") return "100dvh";
  const visualViewportHeight = window.visualViewport?.height ?? 0;
  const innerHeight = window.innerHeight || 0;
  const height = Math.round(visualViewportHeight || innerHeight);
  return height > 0 ? `${height}px` : "100dvh";
}

function syncStableViewportHeight() {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(IPAD_VIEWPORT_HEIGHT_CSS_VAR, getStableViewportHeight());
}

export default function WorkOrderDrawingIpadEditor(props: WorkOrderDrawingEditorProps) {
  useEffect(() => {
    if (!props.open || typeof window === "undefined") return;

    const scheduledTimers = new Set<number>();

    const scheduleViewportSync = () => {
      VIEWPORT_STABILIZATION_DELAYS.forEach((delay) => {
        const timer = window.setTimeout(() => {
          scheduledTimers.delete(timer);
          syncStableViewportHeight();
        }, delay);
        scheduledTimers.add(timer);
      });
    };

    scheduleViewportSync();
    window.addEventListener("resize", scheduleViewportSync);
    window.addEventListener("orientationchange", scheduleViewportSync);
    window.visualViewport?.addEventListener("resize", scheduleViewportSync);

    return () => {
      scheduledTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", scheduleViewportSync);
      window.removeEventListener("orientationchange", scheduleViewportSync);
      window.visualViewport?.removeEventListener("resize", scheduleViewportSync);
      document.documentElement.style.removeProperty(IPAD_VIEWPORT_HEIGHT_CSS_VAR);
    };
  }, [props.open]);

  return (
    <WorkOrderDrawingCanvasEditor
      {...props}
      devicePolicy={DRAWING_DEVICE_POLICIES.ipad}
      useStableViewportHeight
    />
  );
}

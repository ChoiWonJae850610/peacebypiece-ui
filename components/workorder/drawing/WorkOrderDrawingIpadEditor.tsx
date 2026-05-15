"use client";

import { useEffect, useMemo, useState } from "react";
import WorkOrderDrawingCanvasEditor, { type WorkOrderDrawingEditorProps } from "./WorkOrderDrawingCanvasEditor";
import { DRAWING_DEVICE_POLICIES } from "./drawingDevicePolicy";

const IPAD_VIEWPORT_HEIGHT_CSS_VAR = "--pbp-drawing-ipad-viewport-height";
const IPAD_VIEWPORT_WIDTH_CSS_VAR = "--pbp-drawing-ipad-viewport-width";
const VIEWPORT_STABILIZATION_DELAYS = [0, 60, 140, 260, 420, 650, 900] as const;

function getViewportMetric(metric: "width" | "height") {
  if (typeof window === "undefined" || typeof document === "undefined") return 0;

  const visualViewportSize = metric === "height" ? window.visualViewport?.height : window.visualViewport?.width;
  const innerSize = metric === "height" ? window.innerHeight : window.innerWidth;
  const documentSize =
    metric === "height" ? document.documentElement.clientHeight : document.documentElement.clientWidth;

  return Math.round(visualViewportSize || innerSize || documentSize || 0);
}

function getStableViewportSize(metric: "width" | "height") {
  const size = getViewportMetric(metric);
  return size > 0 ? `${size}px` : metric === "height" ? "100dvh" : "100vw";
}

function syncStableViewportSize() {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(IPAD_VIEWPORT_HEIGHT_CSS_VAR, getStableViewportSize("height"));
  document.documentElement.style.setProperty(IPAD_VIEWPORT_WIDTH_CSS_VAR, getStableViewportSize("width"));
}

export default function WorkOrderDrawingIpadEditor(props: WorkOrderDrawingEditorProps) {
  const [orientationRevision, setOrientationRevision] = useState(0);
  const devicePolicy = useMemo(
    () => ({ ...DRAWING_DEVICE_POLICIES.ipad }),
    [orientationRevision],
  );

  useEffect(() => {
    if (!props.open || typeof window === "undefined") return;

    const scheduledTimers = new Set<number>();
    let animationFrame = 0;

    const syncViewportAndOrientation = () => {
      syncStableViewportSize();
      setOrientationRevision((current) => current + 1);
    };

    const scheduleViewportSync = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = window.requestAnimationFrame(syncViewportAndOrientation);
      });

      VIEWPORT_STABILIZATION_DELAYS.forEach((delay) => {
        const timer = window.setTimeout(() => {
          scheduledTimers.delete(timer);
          syncViewportAndOrientation();
        }, delay);
        scheduledTimers.add(timer);
      });
    };

    scheduleViewportSync();
    window.addEventListener("resize", scheduleViewportSync);
    window.addEventListener("orientationchange", scheduleViewportSync);
    window.visualViewport?.addEventListener("resize", scheduleViewportSync);
    window.visualViewport?.addEventListener("scroll", scheduleViewportSync);
    window.screen.orientation?.addEventListener?.("change", scheduleViewportSync);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      scheduledTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", scheduleViewportSync);
      window.removeEventListener("orientationchange", scheduleViewportSync);
      window.visualViewport?.removeEventListener("resize", scheduleViewportSync);
      window.visualViewport?.removeEventListener("scroll", scheduleViewportSync);
      window.screen.orientation?.removeEventListener?.("change", scheduleViewportSync);
      document.documentElement.style.removeProperty(IPAD_VIEWPORT_HEIGHT_CSS_VAR);
      document.documentElement.style.removeProperty(IPAD_VIEWPORT_WIDTH_CSS_VAR);
    };
  }, [props.open]);

  return (
    <WorkOrderDrawingCanvasEditor
      {...props}
      devicePolicy={devicePolicy}
      useStableViewportHeight
    />
  );
}

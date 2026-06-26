"use client";

import { useEffect, useRef, useState, type PointerEvent, type TouchEvent } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { useI18n } from "@/lib/i18n";
import { shouldBlockDrawingForLandscape } from "./drawingDevicePolicy";
import {
  DEFAULT_STROKE_SIZE,
  DRAWING_COLORS,
  DRAWING_MIME_TYPE,
  DRAWING_STROKE_SIZES,
  DrawingIcon,
  MAX_HISTORY_LENGTH,
  PICKER_PANEL_CLASS,
  SHAPE_MIN_DISTANCE,
  TOOLBAR_GROUP_CLASS,
  canRestoreDraftSnapshot,
  clearDrawingDraftSnapshot,
  createDrawingFileName,
  drawBlankCanvas,
  drawShape,
  getCanvasPointFromClientPoint,
  getContainedCanvasDisplaySize,
  getEraserCursor,
  getEraserCursorFromCanvasPoint,
  getEraserLineWidth,
  getPointDistance,
  getPointerPosition,
  getToolButtonClass,
  isColorEnabled,
  isPointInsideCanvas,
  isShapeTool,
  persistDrawingDraftSnapshot,
  readDrawingDraftSnapshot,
  restoreCanvasSnapshot,
} from "./workOrderDrawingCanvasPrimitives";
import type {
  CanvasDisplaySize,
  DrawingLineStyle,
  DrawingLineStyleId,
  DrawingPoint,
  DrawingPopover,
  DrawingPointerEvent,
  DrawingTool,
  DrawingTouchEvent,
  EraserCursor,
  WorkOrderDrawingCanvasEditorProps,
} from "./workOrderDrawingCanvasPrimitives";

export type { WorkOrderDrawingEditorProps } from "./workOrderDrawingCanvasPrimitives";


export default function WorkOrderDrawingCanvasEditor({
  open,
  onClose,
  onSaveDrawing,
  devicePolicy,
  useStableViewportHeight = false,
}: WorkOrderDrawingCanvasEditorProps) {
  const { i18n } = useI18n();
  const ui = i18n.workorder.ui.attachmentPanel.drawingModal;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const strokeDirtyRef = useRef(false);
  const lastPointRef = useRef<DrawingPoint | null>(null);
  const shapeStartPointRef = useRef<DrawingPoint | null>(null);
  const shapeBaseImageDataRef = useRef<ImageData | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const blankSnapshotRef = useRef("");
  const dirtyRef = useRef(false);
  const suppressDraftPersistRef = useRef(false);
  const canvasSize = devicePolicy.canvasSize;
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [strokeColor, setStrokeColor] = useState(DRAWING_COLORS[0]?.value ?? "#111827");
  const [strokeSize, setStrokeSize] = useState(devicePolicy.initialStrokeSize);
  const [lineStyle, setLineStyle] = useState<DrawingLineStyle>("solid");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activePopover, setActivePopover] = useState<DrawingPopover>(null);
  const [eraserCursor, setEraserCursor] = useState<EraserCursor>({ x: 0, y: 0, diameter: 0, visible: false });
  const [closeConfirmVisible, setCloseConfirmVisible] = useState(false);
  const [navigationGuardVisible, setNavigationGuardVisible] = useState(false);
  const [landscapeBlocked, setLandscapeBlocked] = useState(false);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState<CanvasDisplaySize>(() => canvasSize);
  const navigationGuardTimerRef = useRef<number | null>(null);
  const historyGuardActiveRef = useRef(false);
  const touchDrawingActiveRef = useRef(false);
  const isMobile = devicePolicy.variant === "mobile";
  const drawingInputDisabled = landscapeBlocked;
  const toolbarDisabled = drawingInputDisabled;
  const usesTouchOptimizedInput = devicePolicy.variant !== "desktop";
  const shouldBypassUnsavedCloseConfirm = devicePolicy.variant !== "desktop";
  const canUndo = !toolbarDisabled && historyIndex > 0;
  const canRedo = !toolbarDisabled && historyIndex < historyRef.current.length - 1;
  const shapeToolSelected = isShapeTool(tool);
  const colorEnabled = isColorEnabled(tool);
  const selectedStrokeSize = DRAWING_STROKE_SIZES.find((size) => size.value === strokeSize) ?? DEFAULT_STROKE_SIZE;
  const toolButtonCompact = isMobile;
  const toolIconClassName = isMobile ? "h-3.5 w-3.5" : "h-4 w-4";
  const toolbarGroupClassName = isMobile
    ? "flex items-center gap-1 rounded-2xl border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface)] p-1 shadow-sm"
    : TOOLBAR_GROUP_CLASS;
  const pickerPanelClassName = isMobile
    ? "absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-1.5 shadow-xl"
    : PICKER_PANEL_CLASS;
  const selectedLineStyleId: DrawingLineStyleId = lineStyle;
  const eraserLineWidth = getEraserLineWidth(selectedStrokeSize.id);
  const strokeSizeControlLabel =
    tool === "eraser"
      ? ui.eraserSizeGroupAria
      : shapeToolSelected
        ? ui.shapeStrokeSizeGroupAria
        : ui.strokeSizeGroupAria;
  const strokeSizeStatusLabel =
    tool === "eraser"
      ? ui.eraserSizeStatusLabel
      : shapeToolSelected
        ? ui.shapeStrokeSizeStatusLabel
        : ui.strokeSizeStatusLabel;

  const closeToolPopovers = () => setActivePopover(null);
  const persistCurrentDraftSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas || suppressDraftPersistRef.current || !dirtyRef.current) return;
    persistDrawingDraftSnapshot(canvas, blankSnapshotRef.current);
  };
  const togglePopover = (nextPopover: DrawingPopover) => {
    setActivePopover((current) => (current === nextPopover ? null : nextPopover));
  };
  const resetDrawingInteractionState = () => {
    drawingRef.current = false;
    touchDrawingActiveRef.current = false;
    strokeDirtyRef.current = false;
    lastPointRef.current = null;
    shapeStartPointRef.current = null;
    shapeBaseImageDataRef.current = null;
    hideEraserCursor();
    closeToolPopovers();
    setCloseConfirmVisible(false);
    setNavigationGuardVisible(false);
  };

  const closeModalAndReleaseHistoryGuard = () => {
    suppressDraftPersistRef.current = true;
    clearDrawingDraftSnapshot();
    resetDrawingInteractionState();
    dirtyRef.current = false;
    setDirty(false);
    setCloseConfirmVisible(false);
    historyGuardActiveRef.current = false;
    if (
      !shouldBypassUnsavedCloseConfirm &&
      typeof window !== "undefined" &&
      window.history.state &&
      typeof window.history.state === "object" &&
      "pbpDrawingModalGuard" in window.history.state
    ) {
      window.history.back();
    }
    onClose();
  };
  const requestClose = () => {
    closeToolPopovers();
    setNavigationGuardVisible(false);
    if (!shouldBypassUnsavedCloseConfirm && dirty) {
      setCloseConfirmVisible(true);
      return;
    }
    closeModalAndReleaseHistoryGuard();
  };
  const confirmCloseWithoutSaving = () => {
    setCloseConfirmVisible(false);
    setDirty(false);
    closeModalAndReleaseHistoryGuard();
  };
  const hideEraserCursor = () => setEraserCursor((current) => ({ ...current, visible: false }));
  const updateEraserCursor = (event: DrawingPointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || tool !== "eraser") {
      hideEraserCursor();
      return;
    }
    setEraserCursor(getEraserCursor(canvas, event, eraserLineWidth));
  };

  const updateEraserCursorFromPoint = (point: DrawingPoint) => {
    const canvas = canvasRef.current;
    if (!canvas || tool !== "eraser") {
      hideEraserCursor();
      return;
    }
    setEraserCursor(getEraserCursorFromCanvasPoint(canvas, point, eraserLineWidth));
  };

  const shouldHandleTouchEvent = () => usesTouchOptimizedInput;

  const stopTouchPropagation = (event: DrawingTouchEvent) => {
    event.stopPropagation();
    if (event.cancelable) {
      event.preventDefault();
    }
  };

  const getTouchCanvasPoint = (event: DrawingTouchEvent) => {
    const canvas = canvasRef.current;
    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!canvas || !touch) return null;
    return getCanvasPointFromClientPoint(canvas, touch);
  };

  const syncHistoryState = (nextIndex: number) => {
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    const currentSnapshot = historyRef.current[nextIndex] ?? "";
    const nextDirty = Boolean(currentSnapshot && currentSnapshot !== blankSnapshotRef.current);
    dirtyRef.current = nextDirty;
    setDirty(nextDirty);
  };

  const pushHistorySnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL(DRAWING_MIME_TYPE);
    const previousSnapshot = historyRef.current[historyIndexRef.current];
    if (snapshot === previousSnapshot) return;
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(snapshot);
    if (nextHistory.length > MAX_HISTORY_LENGTH) {
      nextHistory.shift();
    }
    historyRef.current = nextHistory;
    syncHistoryState(nextHistory.length - 1);
    persistDrawingDraftSnapshot(canvas, blankSnapshotRef.current);
  };

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;

    const body = document.body;
    const previousDrawingModalOpen = body.dataset.pbpDrawingModalOpen;
    body.dataset.pbpDrawingModalOpen = "true";

    return () => {
      if (previousDrawingModalOpen === undefined) {
        delete body.dataset.pbpDrawingModalOpen;
        return;
      }
      body.dataset.pbpDrawingModalOpen = previousDrawingModalOpen;
    };
  }, [open]);



  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncLandscapeBlocked = () => {
      setLandscapeBlocked(shouldBlockDrawingForLandscape(devicePolicy));
    };

    syncLandscapeBlocked();
    window.addEventListener("resize", syncLandscapeBlocked);
    window.addEventListener("orientationchange", syncLandscapeBlocked);
    return () => {
      window.removeEventListener("resize", syncLandscapeBlocked);
      window.removeEventListener("orientationchange", syncLandscapeBlocked);
    };
  }, [devicePolicy]);


  useEffect(() => {
    if (!open) {
      return;
    }

    const container = canvasContainerRef.current;
    if (!container) {
      return;
    }

    const syncCanvasDisplaySize = () => {
      setCanvasDisplaySize(getContainedCanvasDisplaySize(container, canvasSize));
    };

    syncCanvasDisplaySize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", syncCanvasDisplaySize);
      window.addEventListener("orientationchange", syncCanvasDisplaySize);
      return () => {
        window.removeEventListener("resize", syncCanvasDisplaySize);
        window.removeEventListener("orientationchange", syncCanvasDisplaySize);
      };
    }

    const resizeObserver = new ResizeObserver(syncCanvasDisplaySize);
    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasSize.height, canvasSize.width, open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const persistBeforeViewportChange = () => {
      persistCurrentDraftSnapshot();
    };

    window.addEventListener("resize", persistBeforeViewportChange);
    window.addEventListener("orientationchange", persistBeforeViewportChange);
    window.addEventListener("pagehide", persistBeforeViewportChange);
    document.addEventListener("visibilitychange", persistBeforeViewportChange);

    return () => {
      window.removeEventListener("resize", persistBeforeViewportChange);
      window.removeEventListener("orientationchange", persistBeforeViewportChange);
      window.removeEventListener("pagehide", persistBeforeViewportChange);
      document.removeEventListener("visibilitychange", persistBeforeViewportChange);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !landscapeBlocked) return;
    suppressDraftPersistRef.current = true;
    clearDrawingDraftSnapshot();
    dirtyRef.current = false;
    setDirty(false);
    resetDrawingInteractionState();
  }, [landscapeBlocked, open]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    suppressDraftPersistRef.current = false;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    drawBlankCanvas(canvas);
    const blankSnapshot = canvas.toDataURL(DRAWING_MIME_TYPE);
    const draftSnapshot = readDrawingDraftSnapshot();
    blankSnapshotRef.current = blankSnapshot;
    historyRef.current = [blankSnapshot];
    historyIndexRef.current = 0;
    setHistoryIndex(0);
    setDirty(false);
    dirtyRef.current = false;
    setSaving(false);
    drawingRef.current = false;
    strokeDirtyRef.current = false;
    lastPointRef.current = null;
    shapeStartPointRef.current = null;
    shapeBaseImageDataRef.current = null;
    setTool("pen");
    setStrokeColor(DRAWING_COLORS[0]?.value ?? "#111827");
    setStrokeSize(devicePolicy.initialStrokeSize);
    setLineStyle("solid");
    setActivePopover(null);
    setCloseConfirmVisible(false);
    setNavigationGuardVisible(false);
    hideEraserCursor();
    if (draftSnapshot && canRestoreDraftSnapshot(draftSnapshot, canvas)) {
      restoreCanvasSnapshot(canvas, draftSnapshot.snapshot, () => {
        historyRef.current = [blankSnapshot, draftSnapshot.snapshot];
        syncHistoryState(1);
      });
    } else if (draftSnapshot) {
      clearDrawingDraftSnapshot();
    }
  }, [canvasSize.height, canvasSize.width, isMobile, open]);

  useEffect(() => {
    if (!open || shouldBypassUnsavedCloseConfirm || typeof window === "undefined") return;

    const currentState = window.history.state;
    const nextState =
      currentState && typeof currentState === "object"
        ? { ...currentState, pbpDrawingModalGuard: true }
        : { pbpDrawingModalGuard: true };

    historyGuardActiveRef.current = true;
    window.history.pushState(nextState, "", window.location.href);

    const handlePopState = () => {
      if (!historyGuardActiveRef.current) return;
      window.history.pushState(nextState, "", window.location.href);
      setNavigationGuardVisible(true);
      if (navigationGuardTimerRef.current) {
        window.clearTimeout(navigationGuardTimerRef.current);
      }
      navigationGuardTimerRef.current = window.setTimeout(() => {
        setNavigationGuardVisible(false);
        navigationGuardTimerRef.current = null;
      }, 2400);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      historyGuardActiveRef.current = false;
      if (navigationGuardTimerRef.current) {
        window.clearTimeout(navigationGuardTimerRef.current);
        navigationGuardTimerRef.current = null;
      }
    };
  }, [open, shouldBypassUnsavedCloseConfirm]);

  const drawFreehandLineFromPoint = (nextPoint: DrawingPoint) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (!isPointInsideCanvas(nextPoint, canvas)) return;
    const previousPoint = lastPointRef.current ?? nextPoint;

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = tool === "eraser" ? eraserLineWidth : strokeSize;
    context.strokeStyle = tool === "eraser" ? "#ffffff" : strokeColor;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
    context.restore();

    lastPointRef.current = nextPoint;
    strokeDirtyRef.current = true;
  };

  const drawFreehandLine = (event: DrawingPointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawFreehandLineFromPoint(getPointerPosition(canvas, event));
  };

  const drawShapePreviewFromPoint = (nextPoint: DrawingPoint) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current || !isShapeTool(tool)) return;
    const context = canvas.getContext("2d");
    const startPoint = shapeStartPointRef.current;
    const baseImageData = shapeBaseImageDataRef.current;
    if (!context || !startPoint || !baseImageData) return;
    if (!isPointInsideCanvas(nextPoint, canvas)) return;

    context.putImageData(baseImageData, 0, 0);
    if (getPointDistance(startPoint, nextPoint) < SHAPE_MIN_DISTANCE) return;
    drawShape(context, tool, startPoint, nextPoint, strokeColor, strokeSize, lineStyle);
    strokeDirtyRef.current = true;
  };

  const drawShapePreview = (event: DrawingPointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawShapePreviewFromPoint(getPointerPosition(canvas, event));
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (usesTouchOptimizedInput && event.pointerType === "touch") return;
    if (drawingInputDisabled) return;
    event.preventDefault();
    updateEraserCursor(event);
    if (isShapeTool(tool)) {
      drawShapePreview(event);
      return;
    }
    drawFreehandLine(event);
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (usesTouchOptimizedInput && event.pointerType === "touch") return;
    const canvas = canvasRef.current;
    if (!canvas || drawingInputDisabled) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some mobile WebView implementations may reject pointer capture during orientation changes.
    }
    strokeDirtyRef.current = false;
    closeToolPopovers();
    updateEraserCursor(event);


    drawingRef.current = true;
    const startPoint = getPointerPosition(canvas, event);
    if (!isPointInsideCanvas(startPoint, canvas)) {
      drawingRef.current = false;
      return;
    }
    lastPointRef.current = startPoint;
    shapeStartPointRef.current = startPoint;

    if (isShapeTool(tool)) {
      const context = canvas.getContext("2d");
      shapeBaseImageDataRef.current = context?.getImageData(0, 0, canvas.width, canvas.height) ?? null;
      return;
    }

    drawFreehandLine(event);
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (usesTouchOptimizedInput && event.pointerType === "touch") return;
    const canvas = canvasRef.current;
    if (drawingInputDisabled) {
      drawingRef.current = false;
      hideEraserCursor();
      return;
    }
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore stale pointer capture after mobile orientation changes.
      }
    }


    if (canvas && drawingRef.current && isShapeTool(tool)) {
      drawShapePreview(event);
    }

    drawingRef.current = false;
    touchDrawingActiveRef.current = false;
    lastPointRef.current = null;
    shapeStartPointRef.current = null;
    shapeBaseImageDataRef.current = null;
    if (strokeDirtyRef.current) {
      pushHistorySnapshot();
    }
    strokeDirtyRef.current = false;
    if (tool !== "eraser") {
      hideEraserCursor();
    }
  };

  const finishDrawingFromTouch = (point: DrawingPoint | null) => {
    if (drawingInputDisabled) {
      drawingRef.current = false;
      touchDrawingActiveRef.current = false;
      hideEraserCursor();
      return;
    }
    if (point && drawingRef.current && isShapeTool(tool)) {
      drawShapePreviewFromPoint(point);
    }

    drawingRef.current = false;
    touchDrawingActiveRef.current = false;
    lastPointRef.current = null;
    shapeStartPointRef.current = null;
    shapeBaseImageDataRef.current = null;
    if (strokeDirtyRef.current) {
      pushHistorySnapshot();
    }
    strokeDirtyRef.current = false;
    if (tool !== "eraser") {
      hideEraserCursor();
    }
  };

  const handleTouchStart = (event: DrawingTouchEvent) => {
    if (!shouldHandleTouchEvent()) return;
    const canvas = canvasRef.current;
    const startPoint = getTouchCanvasPoint(event);
    if (!canvas || !startPoint || drawingInputDisabled) return;
    stopTouchPropagation(event);
    touchDrawingActiveRef.current = true;
    strokeDirtyRef.current = false;
    closeToolPopovers();
    updateEraserCursorFromPoint(startPoint);

    drawingRef.current = true;
    if (!isPointInsideCanvas(startPoint, canvas)) {
      drawingRef.current = false;
      touchDrawingActiveRef.current = false;
      return;
    }
    lastPointRef.current = startPoint;
    shapeStartPointRef.current = startPoint;

    if (isShapeTool(tool)) {
      const context = canvas.getContext("2d");
      shapeBaseImageDataRef.current = context?.getImageData(0, 0, canvas.width, canvas.height) ?? null;
      return;
    }

    drawFreehandLineFromPoint(startPoint);
  };

  const handleTouchMove = (event: DrawingTouchEvent) => {
    if (!shouldHandleTouchEvent() || !touchDrawingActiveRef.current) return;
    const nextPoint = getTouchCanvasPoint(event);
    if (!nextPoint || drawingInputDisabled) return;
    stopTouchPropagation(event);
    updateEraserCursorFromPoint(nextPoint);
    if (isShapeTool(tool)) {
      drawShapePreviewFromPoint(nextPoint);
      return;
    }
    drawFreehandLineFromPoint(nextPoint);
  };

  const handleTouchEnd = (event: DrawingTouchEvent) => {
    if (!shouldHandleTouchEvent()) return;
    const endPoint = getTouchCanvasPoint(event);
    if (!drawingInputDisabled) {
      stopTouchPropagation(event);
    }
    finishDrawingFromTouch(endPoint);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || toolbarDisabled || historyIndexRef.current <= 0) return;
    const nextIndex = historyIndexRef.current - 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;
    restoreCanvasSnapshot(canvas, snapshot, () => {
      syncHistoryState(nextIndex);
      persistDrawingDraftSnapshot(canvas, blankSnapshotRef.current);
    });
  };

  const handleRedo = () => {
    const canvas = canvasRef.current;
    if (!canvas || toolbarDisabled || historyIndexRef.current >= historyRef.current.length - 1) return;
    const nextIndex = historyIndexRef.current + 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;
    restoreCanvasSnapshot(canvas, snapshot, () => {
      syncHistoryState(nextIndex);
      persistDrawingDraftSnapshot(canvas, blankSnapshotRef.current);
    });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || toolbarDisabled) return;
    drawBlankCanvas(canvas);
    pushHistorySnapshot();
    clearDrawingDraftSnapshot();
    dirtyRef.current = false;
    setDirty(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || toolbarDisabled || saving || !dirty) return;
    setSaving(true);
    canvas.toBlob((blob) => {
      if (!blob) {
        setSaving(false);
        return;
      }
      const file = new File([blob], createDrawingFileName(), { type: DRAWING_MIME_TYPE });
      suppressDraftPersistRef.current = true;
      clearDrawingDraftSnapshot();
      onSaveDrawing(file);
      setSaving(false);
      setDirty(false);
      dirtyRef.current = false;
      closeModalAndReleaseHistoryGuard();
    }, DRAWING_MIME_TYPE);
  };

  const handleToolSelect = (nextTool: DrawingTool) => {
    if (toolbarDisabled) return;
    setTool(nextTool);
    setActivePopover(null);
    hideEraserCursor();
  };

  const toggleLineStyle = () => {
    if (toolbarDisabled || !shapeToolSelected) return;
    closeToolPopovers();
    setLineStyle((current) => (current === "solid" ? "dashed" : "solid"));
  };

  const handleLandscapeBlockedClose = () => {
    suppressDraftPersistRef.current = true;
    clearDrawingDraftSnapshot();
    dirtyRef.current = false;
    setDirty(false);
    resetDrawingInteractionState();
    closeModalAndReleaseHistoryGuard();
  };

  const stableViewportPanelClassName = useStableViewportHeight
    ? " !h-[var(--pbp-drawing-ipad-viewport-height,100dvh)] !max-h-[var(--pbp-drawing-ipad-viewport-height,100dvh)] md:!h-[var(--pbp-drawing-ipad-viewport-height,100dvh)] md:!max-h-[var(--pbp-drawing-ipad-viewport-height,100dvh)]"
    : "";

  return (
    <ModalShell
      open={open}
      title={ui.title}
      onClose={requestClose}
      maxWidthClass="!max-w-none md:!max-w-none"
      bodyClassName="flex min-h-0 flex-1 flex-col !overflow-hidden !px-1.5 !py-1.5 md:!px-2 md:!py-2"
      panelClassName={`!inset-0 !h-[100dvh] !max-h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 md:!left-0 md:!top-0 md:!bottom-0 md:!h-[100dvh] md:!max-h-[100dvh] md:!w-screen md:!max-w-none md:!translate-x-0 md:!translate-y-0 md:!rounded-none md:!border-0${stableViewportPanelClassName}`}
      overlayClassName="bg-[var(--pbp-bg)]"
      rootClassName="z-[2147483647] isolate pointer-events-auto pbp-drawing-modal-top-layer"
      closeOnBackdrop={false}
      lockBodyPosition={!useStableViewportHeight}
    >
      <div className="flex h-full min-h-0 flex-col gap-1.5">
        <div
          ref={canvasContainerRef}
          className="relative z-10 flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden rounded-3xl bg-[var(--pbp-surface-muted)] p-1.5 shadow-inner sm:p-2"
        >
          <div
            className="relative z-20 overflow-hidden bg-white shadow-sm pointer-events-auto touch-none"
            style={{
              width: `${canvasDisplaySize.width}px`,
              height: `${canvasDisplaySize.height}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{ touchAction: "none" }}
              className={`block h-full w-full touch-none select-none bg-white ${
                landscapeBlocked ? "pointer-events-none cursor-not-allowed" : tool === "eraser" ? "cursor-none" : "cursor-crosshair"
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerCancel={(event) => {
                stopDrawing(event);
                hideEraserCursor();
              }}
              onPointerLeave={(event) => {
                if (drawingRef.current) stopDrawing(event);
                hideEraserCursor();
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              aria-label={ui.canvasAria}
            />
            {landscapeBlocked ? (
              <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--pbp-surface)]/95 px-5 text-center backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-3xl border border-[var(--pbp-warning)] bg-[var(--pbp-warning-soft)] px-5 py-4 text-[var(--pbp-warning-text)] shadow-xl">
                  <div className="text-sm font-bold">{ui.landscapeBlockedTitle}</div>
                  <div className="mt-2 text-xs font-semibold leading-5">{ui.landscapeBlockedMessage}</div>
                  <button
                    type="button"
                    onClick={handleLandscapeBlockedClose}
                    className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 text-xs font-bold pbp-text-primary shadow-sm"
                  >
                    {ui.landscapeBlockedClose}
                  </button>
                </div>
              </div>
            ) : null}
            {tool === "eraser" && eraserCursor.visible && !landscapeBlocked ? (
              <div
                className="pointer-events-none absolute rounded-full border border-[var(--pbp-danger)] bg-[var(--pbp-danger-soft)]/35 shadow-sm"
                style={{
                  left: eraserCursor.x,
                  top: eraserCursor.y,
                  width: eraserCursor.diameter,
                  height: eraserCursor.diameter,
                  transform: "translate(-50%, -50%)",
                }}
                aria-hidden="true"
              />
            ) : null}
          </div>
        </div>

        <div className={isMobile ? "shrink-0 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-1 shadow-sm" : "shrink-0 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-1.5 shadow-sm sm:p-2"}>
          <div className={isMobile ? "flex flex-wrap items-center justify-center gap-1" : "flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"}>
            <div className={toolbarGroupClassName} aria-label={ui.toolGroupAria}>
              {([
                ["pen", ui.pen, "pen"],
                ["eraser", ui.eraser, "eraser"],
                ["line", ui.line, "line"],
                ["arrow", ui.arrow, "arrow"],
                ["rectangle", ui.rectangle, "rectangle"],
                ["ellipse", ui.ellipse, "ellipse"],
              ] as const).map(([toolId, label, iconName]) => (
                <button
                  key={toolId}
                  type="button"
                  onClick={() => handleToolSelect(toolId)}
                  disabled={toolbarDisabled}
                  className={getToolButtonClass(tool === toolId, toolbarDisabled, toolButtonCompact)}
                  aria-label={label}
                  title={label}
                  aria-pressed={tool === toolId}
                >
                  <DrawingIcon name={iconName} className={toolIconClassName} />
                </button>
              ))}
            </div>

            <div className={toolbarGroupClassName}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => colorEnabled && !toolbarDisabled && togglePopover("color")}
                  disabled={!colorEnabled || toolbarDisabled}
                  className={getToolButtonClass(activePopover === "color", !colorEnabled || toolbarDisabled, toolButtonCompact)}
                  aria-label={ui.colorGroupAria}
                  title={ui.colorGroupAria}
                  aria-expanded={activePopover === "color"}
                >
                  <span
                    className={isMobile ? "h-4 w-4 rounded-md border border-black/10 shadow-sm" : "h-5 w-5 rounded-md border border-black/10 shadow-sm"}
                    style={{ backgroundColor: strokeColor }}
                    aria-hidden="true"
                  />
                </button>
                {activePopover === "color" && colorEnabled && !toolbarDisabled ? (
                  <div className={`${pickerPanelClassName} flex gap-1.5`} aria-label={ui.colorGroupAria}>
                    {DRAWING_COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          setStrokeColor(color.value);
                          closeToolPopovers();
                        }}
                        className={`${isMobile ? "h-8 w-8" : "h-9 w-9"} rounded-xl border shadow-sm transition ${
                          strokeColor === color.value
                            ? "ring-2 ring-[var(--pbp-accent)] ring-offset-2 ring-offset-[var(--pbp-surface)]"
                            : "border-[var(--pbp-border)]"
                        }`}
                        style={{ backgroundColor: color.value }}
                        aria-label={ui.colorLabels[color.id] ?? color.id}
                        title={ui.colorLabels[color.id] ?? color.id}
                        aria-pressed={strokeColor === color.value}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => !toolbarDisabled && togglePopover("strokeSize")}
                  disabled={toolbarDisabled}
                  className={getToolButtonClass(activePopover === "strokeSize", toolbarDisabled, toolButtonCompact)}
                  aria-label={strokeSizeControlLabel}
                  title={strokeSizeControlLabel}
                  aria-expanded={activePopover === "strokeSize"}
                >
                  <DrawingIcon name="stroke" className={toolIconClassName} />
                </button>
                {activePopover === "strokeSize" && !toolbarDisabled ? (
                  <div className={`${pickerPanelClassName} grid w-32 gap-1.5 sm:w-36`} aria-label={strokeSizeControlLabel}>
                    {DRAWING_STROKE_SIZES.map((size) => (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => {
                          setStrokeSize(size.value);
                          closeToolPopovers();
                        }}
                        className={`pbp-interactive-button flex ${isMobile ? "h-8" : "h-9"} items-center gap-2 rounded-xl px-2 text-xs font-semibold ${
                          strokeSize === size.value ? "pbp-action-primary" : "pbp-action-secondary"
                        }`}
                        aria-label={ui.strokeSizeLabels[size.id] ?? size.id}
                        title={ui.strokeSizeLabels[size.id] ?? size.id}
                        aria-pressed={strokeSize === size.value}
                      >
                        <span className={`w-12 rounded-full bg-current ${size.previewClassName}`} aria-hidden="true" />
                        <span>{ui.strokeSizeLabels[size.id] ?? size.id}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={toggleLineStyle}
                disabled={!shapeToolSelected || toolbarDisabled}
                className={getToolButtonClass(shapeToolSelected && lineStyle === "dashed", !shapeToolSelected || toolbarDisabled, toolButtonCompact)}
                aria-label={ui.lineStyleToggleAria}
                title={shapeToolSelected ? (ui.lineStyleLabels[selectedLineStyleId] ?? selectedLineStyleId) : ui.lineStyleDisabledLabel}
                aria-pressed={lineStyle === "dashed"}
              >
                <DrawingIcon name={lineStyle === "dashed" ? "dashed" : "solid"} className={toolIconClassName} />
              </button>
            </div>

            <div className={toolbarGroupClassName}>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className={getToolButtonClass(false, !canUndo, toolButtonCompact)}
                aria-label={ui.undo}
                title={ui.undo}
              >
                <DrawingIcon name="undo" className={toolIconClassName} />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className={getToolButtonClass(false, !canRedo, toolButtonCompact)}
                aria-label={ui.redo}
                title={ui.redo}
              >
                <DrawingIcon name="redo" className={toolIconClassName} />
              </button>
            </div>

            <div className={isMobile ? "hidden" : "min-w-[150px] rounded-2xl border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface)] px-3 py-2 text-center text-[11px] leading-5 text-[var(--pbp-text-muted)]"}>
              <span className="font-semibold text-[var(--pbp-text)]">{ui.toolLabels[tool] ?? tool}</span>
              <span> 쨌 {strokeSizeStatusLabel} {ui.strokeSizeLabels[selectedStrokeSize.id] ?? selectedStrokeSize.id}</span>
              {shapeToolSelected ? <span> 쨌 {ui.lineStyleLabels[selectedLineStyleId] ?? selectedLineStyleId}</span> : null}
            </div>

            <div className={toolbarGroupClassName}>
              <button
                type="button"
                onClick={handleClear}
                disabled={toolbarDisabled}
                className={isMobile ? "pbp-interactive-button pbp-action-secondary inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50" : "pbp-interactive-button pbp-action-secondary inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"}
              >
                <DrawingIcon name="trash" className={toolIconClassName} />
                <span className={isMobile ? "sr-only" : undefined}>{ui.clear}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={toolbarDisabled || saving || !dirty}
                className={isMobile ? "pbp-interactive-button pbp-action-primary inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50" : "pbp-interactive-button pbp-action-primary inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"}
              >
                <DrawingIcon name="save" className={toolIconClassName} />
                <span className={isMobile ? "sr-only" : undefined}>{saving ? ui.saving : ui.save}</span>
              </button>
            </div>

            {navigationGuardVisible ? (
              <div className="w-full rounded-2xl border border-[var(--pbp-warning)] bg-[var(--pbp-warning-soft)] px-3 py-2 text-center text-xs font-semibold text-[var(--pbp-warning-text)]">
                {ui.navigationBlockedMessage}
              </div>
            ) : null}

            {closeConfirmVisible ? (
              <div className="w-full rounded-2xl border border-[var(--pbp-danger)] bg-[var(--pbp-danger-soft)] p-3 text-sm text-[var(--pbp-danger-text)]">
                <div className="font-semibold">{ui.unsavedCloseTitle}</div>
                <div className="mt-1 text-xs leading-5">{ui.unsavedCloseMessage}</div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setCloseConfirmVisible(false)}
                    className="pbp-interactive-button pbp-action-secondary rounded-full px-4 py-2 text-xs font-semibold"
                  >
                    {ui.keepDrawing}
                  </button>
                  <button
                    type="button"
                    onClick={confirmCloseWithoutSaving}
                    className="pbp-interactive-button pbp-action-danger rounded-full px-4 py-2 text-xs font-semibold"
                  >
                    {ui.closeWithoutSaving}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

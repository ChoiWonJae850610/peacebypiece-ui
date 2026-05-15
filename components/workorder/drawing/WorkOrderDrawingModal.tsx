"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { useI18n } from "@/lib/i18n";

type DrawingTool = "pen" | "eraser" | "line" | "arrow" | "rectangle" | "ellipse";
type DrawingLineStyle = "solid" | "dashed";
type DrawingIconName =
  | "pen"
  | "eraser"
  | "line"
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "undo"
  | "redo"
  | "trash"
  | "save"
  | "stroke"
  | "solid"
  | "dashed";

type WorkOrderDrawingModalProps = {
  open: boolean;
  onClose: () => void;
  onSaveDrawing: (file: File) => void;
  variant?: "desktop" | "tablet" | "mobile";
};

type DrawingColorId = "black" | "red" | "blue" | "green";
type DrawingStrokeSizeId = "thin" | "regular" | "bold" | "wide";
type DrawingLineStyleId = DrawingLineStyle;
type DrawingPopover = "color" | "strokeSize" | null;
type DrawingPointerEvent = PointerEvent<HTMLElement>;
type EraserCursor = { x: number; y: number; diameter: number; visible: boolean };
type CanvasDisplaySize = { width: number; height: number };
type DrawingDraftSnapshot = { snapshot: string; width: number; height: number };
type DrawingColor = {
  id: DrawingColorId;
  value: string;
};

type DrawingStrokeSize = {
  id: DrawingStrokeSizeId;
  value: number;
  previewClassName: string;
};


type DrawingPoint = {
  x: number;
  y: number;
};

const DRAWING_MIME_TYPE = "image/png";
const DRAWING_FILE_EXTENSION = "png";
const DRAWING_DRAFT_STORAGE_KEY = "peacebypiece.workorder.designDrawingDraft";
const DRAWING_DRAFT_FORMAT_VERSION = 3;
const DESKTOP_CANVAS_WIDTH = 1280;
const DESKTOP_CANVAS_HEIGHT = 900;
const PORTRAIT_CANVAS_WIDTH = 900;
const PORTRAIT_CANVAS_HEIGHT = 1280;
const MAX_HISTORY_LENGTH = 24;
const ERASER_LINE_WIDTH_BY_STROKE_SIZE: Record<DrawingStrokeSizeId, number> = {
  thin: 20,
  regular: 34,
  bold: 52,
  wide: 72,
};
const SHAPE_MIN_DISTANCE = 2;
const DRAWING_COLORS: DrawingColor[] = [
  { id: "black", value: "#111827" },
  { id: "red", value: "#dc2626" },
  { id: "blue", value: "#2563eb" },
  { id: "green", value: "#059669" },
];

const DRAWING_STROKE_SIZES: DrawingStrokeSize[] = [
  { id: "thin", value: 3, previewClassName: "h-0.5" },
  { id: "regular", value: 6, previewClassName: "h-1" },
  { id: "bold", value: 10, previewClassName: "h-1.5" },
  { id: "wide", value: 16, previewClassName: "h-2" },
];
const DEFAULT_STROKE_SIZE: DrawingStrokeSize = DRAWING_STROKE_SIZES[0] ?? {
  id: "thin",
  value: 3,
  previewClassName: "h-0.5",
};


const TOOL_BUTTON_BASE_CLASS =
  "pbp-interactive-button inline-flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";
const TOOL_BUTTON_ACTIVE_CLASS = "pbp-action-primary border-[var(--pbp-accent)] shadow-sm";
const TOOL_BUTTON_INACTIVE_CLASS = "pbp-action-secondary border-[var(--pbp-border)]";
const TOOL_BUTTON_DISABLED_CLASS = "border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]";
const PICKER_PANEL_CLASS =
  "absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-2 shadow-xl";
const TOOLBAR_GROUP_CLASS =
  "flex items-center gap-1.5 rounded-2xl border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface)] p-1.5 shadow-sm";

function getCanvasSize(variant: WorkOrderDrawingModalProps["variant"]) {
  if (variant === "desktop") {
    return { width: DESKTOP_CANVAS_WIDTH, height: DESKTOP_CANVAS_HEIGHT };
  }

  return { width: PORTRAIT_CANVAS_WIDTH, height: PORTRAIT_CANVAS_HEIGHT };
}

function isShapeTool(tool: DrawingTool) {
  return tool === "line" || tool === "arrow" || tool === "rectangle" || tool === "ellipse";
}


function isColorEnabled(tool: DrawingTool) {
  return tool !== "eraser";
}

function getEraserLineWidth(strokeSizeId: DrawingStrokeSizeId) {
  return ERASER_LINE_WIDTH_BY_STROKE_SIZE[strokeSizeId] ?? ERASER_LINE_WIDTH_BY_STROKE_SIZE.regular;
}

function getPointerPosition(canvas: HTMLCanvasElement, event: DrawingPointerEvent) {
  const rect = canvas.getBoundingClientRect();
  const safeWidth = rect.width || 1;
  const safeHeight = rect.height || 1;
  return {
    x: ((event.clientX - rect.left) / safeWidth) * canvas.width,
    y: ((event.clientY - rect.top) / safeHeight) * canvas.height,
  };
}

function isPointInsideCanvas(point: DrawingPoint, canvas: HTMLCanvasElement) {
  return point.x >= 0 && point.x <= canvas.width && point.y >= 0 && point.y <= canvas.height;
}

function getEraserCursor(
  canvas: HTMLCanvasElement,
  event: DrawingPointerEvent,
  eraserLineWidth: number,
): EraserCursor {
  const canvasPoint = getPointerPosition(canvas, event);
  if (!isPointInsideCanvas(canvasPoint, canvas)) {
    return { x: 0, y: 0, diameter: 0, visible: false };
  }

  const canvasRect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - canvasRect.left,
    y: event.clientY - canvasRect.top,
    diameter: Math.max(18, (eraserLineWidth / canvas.width) * canvasRect.width),
    visible: true,
  };
}

function getContainedCanvasDisplaySize(
  container: HTMLDivElement,
  canvasSize: { width: number; height: number },
): CanvasDisplaySize {
  const safeWidth = Math.max(1, container.clientWidth);
  const safeHeight = Math.max(1, container.clientHeight);
  const scale = Math.min(safeWidth / canvasSize.width, safeHeight / canvasSize.height);
  return {
    width: Math.max(1, Math.floor(canvasSize.width * scale)),
    height: Math.max(1, Math.floor(canvasSize.height * scale)),
  };
}


function getPointDistance(start: DrawingPoint, end: DrawingPoint) {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

function applyStrokeStyle(
  context: CanvasRenderingContext2D,
  strokeColor: string,
  strokeSize: number,
  lineStyle: DrawingLineStyle,
) {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = strokeSize;
  context.strokeStyle = strokeColor;
  context.fillStyle = strokeColor;
  context.setLineDash(lineStyle === "dashed" ? [strokeSize * 2.4, strokeSize * 1.8] : []);
}

function drawArrowHead(context: CanvasRenderingContext2D, start: DrawingPoint, end: DrawingPoint, strokeSize: number) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const length = Math.max(18, strokeSize * 4.2);
  const spread = Math.PI / 7;

  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - length * Math.cos(angle - spread), end.y - length * Math.sin(angle - spread));
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - length * Math.cos(angle + spread), end.y - length * Math.sin(angle + spread));
  context.stroke();
}

function drawShape(
  context: CanvasRenderingContext2D,
  tool: DrawingTool,
  start: DrawingPoint,
  end: DrawingPoint,
  strokeColor: string,
  strokeSize: number,
  lineStyle: DrawingLineStyle,
) {
  context.save();
  applyStrokeStyle(context, strokeColor, strokeSize, lineStyle);

  if (tool === "line" || tool === "arrow") {
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    if (tool === "arrow") {
      drawArrowHead(context, start, end, strokeSize);
    }
    context.restore();
    return;
  }

  if (tool === "rectangle") {
    context.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
    context.restore();
    return;
  }

  if (tool === "ellipse") {
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    const radiusX = Math.abs(end.x - start.x) / 2;
    const radiusY = Math.abs(end.y - start.y) / 2;
    if (radiusX < 1 || radiusY < 1) {
      context.restore();
      return;
    }
    context.beginPath();
    context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    context.stroke();
  }

  context.restore();
}

function createDrawingFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `workorder-drawing-${stamp}.${DRAWING_FILE_EXTENSION}`;
}

function readDrawingDraftSnapshot(): DrawingDraftSnapshot | null {
  if (typeof window === "undefined") return null;
  const rawSnapshot = window.sessionStorage.getItem(DRAWING_DRAFT_STORAGE_KEY);
  if (!rawSnapshot) return null;

  if (rawSnapshot.startsWith("data:")) {
    window.sessionStorage.removeItem(DRAWING_DRAFT_STORAGE_KEY);
    return null;
  }

  try {
    const parsed = JSON.parse(rawSnapshot) as Partial<DrawingDraftSnapshot> & { version?: number };
    if (
      parsed.version === DRAWING_DRAFT_FORMAT_VERSION &&
      typeof parsed.snapshot === "string" &&
      parsed.snapshot.startsWith("data:") &&
      typeof parsed.width === "number" &&
      typeof parsed.height === "number"
    ) {
      return { snapshot: parsed.snapshot, width: parsed.width, height: parsed.height };
    }
  } catch {
    // Invalid or legacy draft data should not be restored into the fixed portrait editor.
  }

  window.sessionStorage.removeItem(DRAWING_DRAFT_STORAGE_KEY);
  return null;
}

function writeDrawingDraftSnapshot(snapshot: string, canvasWidth: number, canvasHeight: number) {
  if (typeof window === "undefined" || !snapshot) return;
  window.sessionStorage.setItem(
    DRAWING_DRAFT_STORAGE_KEY,
    JSON.stringify({
      version: DRAWING_DRAFT_FORMAT_VERSION,
      snapshot,
      width: canvasWidth,
      height: canvasHeight,
    }),
  );
}

function clearDrawingDraftSnapshot() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DRAWING_DRAFT_STORAGE_KEY);
}

function persistDrawingDraftSnapshot(canvas: HTMLCanvasElement, blankSnapshot: string) {
  const snapshot = canvas.toDataURL(DRAWING_MIME_TYPE);
  if (!snapshot || snapshot === blankSnapshot) {
    clearDrawingDraftSnapshot();
    return;
  }
  writeDrawingDraftSnapshot(snapshot, canvas.width, canvas.height);
}

function canRestoreDraftSnapshot(draftSnapshot: DrawingDraftSnapshot, canvas: HTMLCanvasElement) {
  return draftSnapshot.width === canvas.width && draftSnapshot.height === canvas.height;
}

function drawBlankCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

function restoreCanvasSnapshot(canvas: HTMLCanvasElement, snapshot: string, onRestored?: () => void) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const image = new Image();
  image.onload = () => {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.restore();
    onRestored?.();
  };
  image.src = snapshot;
}

function isTabletLikeTouchViewport() {
  if (typeof window === "undefined") return false;
  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const minSide = Math.min(viewportWidth, viewportHeight);
  const maxSide = Math.max(viewportWidth, viewportHeight);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const multiTouch = window.navigator.maxTouchPoints >= 2;
  return (coarsePointer || multiTouch) && minSide >= 600 && maxSide >= 900;
}

function getToolButtonClass(active: boolean, disabled = false) {
  if (disabled) return `${TOOL_BUTTON_BASE_CLASS} ${TOOL_BUTTON_DISABLED_CLASS}`;
  return `${TOOL_BUTTON_BASE_CLASS} ${active ? TOOL_BUTTON_ACTIVE_CLASS : TOOL_BUTTON_INACTIVE_CLASS}`;
}

function DrawingIcon({ name, className = "h-4 w-4" }: { name: DrawingIconName; className?: string }) {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "pen") {
    return (
      <svg {...commonProps}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }
  if (name === "eraser") {
    return (
      <svg {...commonProps}>
        <path d="m7 21-4-4 10-10 6 6-8 8Z" />
        <path d="m13 7 4-4 4 4-4 4" />
        <path d="M22 21H7" />
      </svg>
    );
  }
  if (name === "line") {
    return (
      <svg {...commonProps}>
        <path d="M5 19 19 5" />
      </svg>
    );
  }
  if (name === "arrow") {
    return (
      <svg {...commonProps}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }
  if (name === "rectangle") {
    return (
      <svg {...commonProps}>
        <rect x="5" y="6" width="14" height="12" rx="1.5" />
      </svg>
    );
  }
  if (name === "ellipse") {
    return (
      <svg {...commonProps}>
        <ellipse cx="12" cy="12" rx="7" ry="5" />
      </svg>
    );
  }
  if (name === "undo") {
    return (
      <svg {...commonProps}>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10a6 6 0 0 1 0 12h-1" />
      </svg>
    );
  }
  if (name === "redo") {
    return (
      <svg {...commonProps}>
        <path d="m15 14 5-5-5-5" />
        <path d="M20 9H10a6 6 0 0 0 0 12h1" />
      </svg>
    );
  }
  if (name === "trash") {
    return (
      <svg {...commonProps}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m6 6 1 15h10l1-15" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    );
  }
  if (name === "save") {
    return (
      <svg {...commonProps}>
        <path d="M5 3h12l2 2v16H5Z" />
        <path d="M8 3v6h8" />
        <path d="M8 21v-7h8v7" />
      </svg>
    );
  }
  if (name === "stroke") {
    return (
      <svg {...commonProps}>
        <path d="M4 7h16" />
        <path d="M4 12h16" strokeWidth={3} />
        <path d="M4 18h16" strokeWidth={4} />
      </svg>
    );
  }
  if (name === "dashed") {
    return (
      <svg {...commonProps}>
        <path d="M4 12h3" />
        <path d="M10.5 12h3" />
        <path d="M17 12h3" />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <path d="M4 12h16" />
    </svg>
  );
}

export default function WorkOrderDrawingModal({
  open,
  onClose,
  onSaveDrawing,
  variant = "desktop",
}: WorkOrderDrawingModalProps) {
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
  const [tabletLikeTouchViewport, setTabletLikeTouchViewport] = useState(false);
  const effectiveVariant = variant === "desktop" && tabletLikeTouchViewport ? "tablet" : variant;
  const canvasSize = getCanvasSize(effectiveVariant);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [strokeColor, setStrokeColor] = useState(DRAWING_COLORS[0]?.value ?? "#111827");
  const [strokeSize, setStrokeSize] = useState(variant === "mobile" ? 6 : 3);
  const [lineStyle, setLineStyle] = useState<DrawingLineStyle>("solid");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activePopover, setActivePopover] = useState<DrawingPopover>(null);
  const [eraserCursor, setEraserCursor] = useState<EraserCursor>({ x: 0, y: 0, diameter: 0, visible: false });
  const [closeConfirmVisible, setCloseConfirmVisible] = useState(false);
  const [navigationGuardVisible, setNavigationGuardVisible] = useState(false);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState<CanvasDisplaySize>(() => canvasSize);
  const navigationGuardTimerRef = useRef<number | null>(null);
  const historyGuardActiveRef = useRef(false);
  const isMobile = effectiveVariant === "mobile";
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;
  const shapeToolSelected = isShapeTool(tool);
  const colorEnabled = isColorEnabled(tool);
  const selectedStrokeSize = DRAWING_STROKE_SIZES.find((size) => size.value === strokeSize) ?? DEFAULT_STROKE_SIZE;
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
  const closeModalAndReleaseHistoryGuard = () => {
    suppressDraftPersistRef.current = true;
    clearDrawingDraftSnapshot();
    historyGuardActiveRef.current = false;
    if (
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
    if (dirty) {
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
    if (typeof window === "undefined") return;

    const syncTabletLikeViewport = () => {
      setTabletLikeTouchViewport(isTabletLikeTouchViewport());
    };

    syncTabletLikeViewport();
    window.addEventListener("resize", syncTabletLikeViewport);
    window.addEventListener("orientationchange", syncTabletLikeViewport);
    return () => {
      window.removeEventListener("resize", syncTabletLikeViewport);
      window.removeEventListener("orientationchange", syncTabletLikeViewport);
    };
  }, []);


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
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
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
    setStrokeSize(isMobile ? 6 : 3);
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
    if (!open || typeof window === "undefined") return;

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
  }, [open]);

  const drawFreehandLine = (event: DrawingPointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const nextPoint = getPointerPosition(canvas, event);
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

  const drawShapePreview = (event: DrawingPointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current || !isShapeTool(tool)) return;
    const context = canvas.getContext("2d");
    const startPoint = shapeStartPointRef.current;
    const baseImageData = shapeBaseImageDataRef.current;
    if (!context || !startPoint || !baseImageData) return;
    const nextPoint = getPointerPosition(canvas, event);
    if (!isPointInsideCanvas(nextPoint, canvas)) return;

    context.putImageData(baseImageData, 0, 0);
    if (getPointDistance(startPoint, nextPoint) < SHAPE_MIN_DISTANCE) return;
    drawShape(context, tool, startPoint, nextPoint, strokeColor, strokeSize, lineStyle);
    strokeDirtyRef.current = true;
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    updateEraserCursor(event);
    if (isShapeTool(tool)) {
      drawShapePreview(event);
      return;
    }
    drawFreehandLine(event);
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
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
    const canvas = canvasRef.current;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }


    if (canvas && drawingRef.current && isShapeTool(tool)) {
      drawShapePreview(event);
    }

    drawingRef.current = false;
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

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
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
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
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
    if (!canvas) return;
    drawBlankCanvas(canvas);
    pushHistorySnapshot();
    clearDrawingDraftSnapshot();
    dirtyRef.current = false;
    setDirty(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || saving || !dirty) return;
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
    setTool(nextTool);
    setActivePopover(null);
    hideEraserCursor();
  };

  const toggleLineStyle = () => {
    if (!shapeToolSelected) return;
    closeToolPopovers();
    setLineStyle((current) => (current === "solid" ? "dashed" : "solid"));
  };

  return (
    <ModalShell
      open={open}
      title={ui.title}
      onClose={requestClose}
      maxWidthClass="!max-w-none md:!max-w-none"
      bodyClassName="flex min-h-0 flex-1 flex-col !overflow-hidden !px-1.5 !py-1.5 md:!px-2 md:!py-2"
      panelClassName="!inset-0 !h-[100dvh] !max-h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 md:!left-0 md:!top-0 md:!bottom-0 md:!h-[100dvh] md:!max-h-[100dvh] md:!w-screen md:!max-w-none md:!translate-x-0 md:!translate-y-0 md:!rounded-none md:!border-0"
      overlayClassName="bg-[var(--pbp-bg)]"
      closeOnBackdrop={false}
    >
      <div className="flex h-full min-h-0 flex-col gap-1.5">
        <div
          ref={canvasContainerRef}
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-3xl bg-[var(--pbp-surface-muted)] p-1.5 shadow-inner sm:p-2"
        >
          <div
            className="relative overflow-hidden bg-white shadow-sm"
            style={{
              width: `${canvasDisplaySize.width}px`,
              height: `${canvasDisplaySize.height}px`,
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className={`block h-full w-full touch-none select-none bg-white ${
                tool === "eraser" ? "cursor-none" : "cursor-crosshair"
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
              aria-label={ui.canvasAria}
            />
            {tool === "eraser" && eraserCursor.visible ? (
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

        <div className="shrink-0 rounded-3xl border border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] p-1.5 shadow-sm sm:p-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <div className={TOOLBAR_GROUP_CLASS} aria-label={ui.toolGroupAria}>
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
                  className={getToolButtonClass(tool === toolId)}
                  aria-label={label}
                  title={label}
                  aria-pressed={tool === toolId}
                >
                  <DrawingIcon name={iconName} />
                </button>
              ))}
            </div>

            <div className={TOOLBAR_GROUP_CLASS}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => colorEnabled && togglePopover("color")}
                  disabled={!colorEnabled}
                  className={getToolButtonClass(activePopover === "color", !colorEnabled)}
                  aria-label={ui.colorGroupAria}
                  title={ui.colorGroupAria}
                  aria-expanded={activePopover === "color"}
                >
                  <span
                    className="h-5 w-5 rounded-md border border-black/10 shadow-sm"
                    style={{ backgroundColor: strokeColor }}
                    aria-hidden="true"
                  />
                </button>
                {activePopover === "color" && colorEnabled ? (
                  <div className={`${PICKER_PANEL_CLASS} flex gap-1.5`} aria-label={ui.colorGroupAria}>
                    {DRAWING_COLORS.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          setStrokeColor(color.value);
                          closeToolPopovers();
                        }}
                        className={`h-9 w-9 rounded-xl border shadow-sm transition ${
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
                  onClick={() => togglePopover("strokeSize")}
                  disabled={false}
                  className={getToolButtonClass(activePopover === "strokeSize")}
                  aria-label={strokeSizeControlLabel}
                  title={strokeSizeControlLabel}
                  aria-expanded={activePopover === "strokeSize"}
                >
                  <DrawingIcon name="stroke" />
                </button>
                {activePopover === "strokeSize" ? (
                  <div className={`${PICKER_PANEL_CLASS} grid w-36 gap-1.5`} aria-label={strokeSizeControlLabel}>
                    {DRAWING_STROKE_SIZES.map((size) => (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => {
                          setStrokeSize(size.value);
                          closeToolPopovers();
                        }}
                        className={`pbp-interactive-button flex h-9 items-center gap-2 rounded-xl px-2 text-xs font-semibold ${
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
                disabled={!shapeToolSelected}
                className={getToolButtonClass(shapeToolSelected && lineStyle === "dashed", !shapeToolSelected)}
                aria-label={ui.lineStyleToggleAria}
                title={shapeToolSelected ? (ui.lineStyleLabels[selectedLineStyleId] ?? selectedLineStyleId) : ui.lineStyleDisabledLabel}
                aria-pressed={lineStyle === "dashed"}
              >
                <DrawingIcon name={lineStyle === "dashed" ? "dashed" : "solid"} />
              </button>
            </div>

            <div className={TOOLBAR_GROUP_CLASS}>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className={getToolButtonClass(false, !canUndo)}
                aria-label={ui.undo}
                title={ui.undo}
              >
                <DrawingIcon name="undo" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className={getToolButtonClass(false, !canRedo)}
                aria-label={ui.redo}
                title={ui.redo}
              >
                <DrawingIcon name="redo" />
              </button>
            </div>

            <div className="min-w-[150px] rounded-2xl border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface)] px-3 py-2 text-center text-[11px] leading-5 text-[var(--pbp-text-muted)]">
              <span className="font-semibold text-[var(--pbp-text)]">{ui.toolLabels[tool] ?? tool}</span>
              <span> · {strokeSizeStatusLabel} {ui.strokeSizeLabels[selectedStrokeSize.id] ?? selectedStrokeSize.id}</span>
              {shapeToolSelected ? <span> · {ui.lineStyleLabels[selectedLineStyleId] ?? selectedLineStyleId}</span> : null}
            </div>

            <div className={TOOLBAR_GROUP_CLASS}>
              <button
                type="button"
                onClick={handleClear}
                className="pbp-interactive-button pbp-action-secondary inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold"
              >
                <DrawingIcon name="trash" />
                <span>{ui.clear}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !dirty}
                className="pbp-interactive-button pbp-action-primary inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <DrawingIcon name="save" />
                <span>{saving ? ui.saving : ui.save}</span>
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
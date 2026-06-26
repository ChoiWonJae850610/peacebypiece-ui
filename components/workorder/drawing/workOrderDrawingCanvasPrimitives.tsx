import type { PointerEvent, TouchEvent } from "react";
import type { DrawingDevicePolicy } from "./drawingDevicePolicy";
export type DrawingTool = "pen" | "eraser" | "line" | "arrow" | "rectangle" | "ellipse";
export type DrawingLineStyle = "solid" | "dashed";
export type DrawingIconName =
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

export type WorkOrderDrawingEditorProps = {
  open: boolean;
  onClose: () => void;
  onSaveDrawing: (file: File) => void;
};

export type WorkOrderDrawingCanvasEditorProps = WorkOrderDrawingEditorProps & {
  devicePolicy: DrawingDevicePolicy;
  useStableViewportHeight?: boolean;
};

export type DrawingColorId = "black" | "red" | "blue" | "green";
export type DrawingStrokeSizeId = "thin" | "regular" | "bold" | "wide";
export type DrawingLineStyleId = DrawingLineStyle;
export type DrawingPopover = "color" | "strokeSize" | null;
export type DrawingPointerEvent = PointerEvent<HTMLElement>;
export type DrawingTouchEvent = TouchEvent<HTMLElement>;
export type EraserCursor = { x: number; y: number; diameter: number; visible: boolean };
export type CanvasDisplaySize = { width: number; height: number };
export type DrawingDraftSnapshot = { snapshot: string; width: number; height: number };
export type DrawingColor = {
  id: DrawingColorId;
  value: string;
};

export type DrawingStrokeSize = {
  id: DrawingStrokeSizeId;
  value: number;
  previewClassName: string;
};


export type DrawingPoint = {
  x: number;
  y: number;
};

export const DRAWING_MIME_TYPE = "image/png";
export const DRAWING_FILE_EXTENSION = "png";
export const DRAWING_DRAFT_STORAGE_KEY = "peacebypiece.workorder.designDrawingDraft";
export const DRAWING_DRAFT_FORMAT_VERSION = 6;
export const MAX_HISTORY_LENGTH = 24;
export const ERASER_LINE_WIDTH_BY_STROKE_SIZE: Record<DrawingStrokeSizeId, number> = {
  thin: 20,
  regular: 34,
  bold: 52,
  wide: 72,
};
export const SHAPE_MIN_DISTANCE = 2;
export const DRAWING_COLORS: DrawingColor[] = [
  { id: "black", value: "#111827" },
  { id: "red", value: "#dc2626" },
  { id: "blue", value: "#2563eb" },
  { id: "green", value: "#059669" },
];

export const DRAWING_STROKE_SIZES: DrawingStrokeSize[] = [
  { id: "thin", value: 3, previewClassName: "h-0.5" },
  { id: "regular", value: 6, previewClassName: "h-1" },
  { id: "bold", value: 10, previewClassName: "h-1.5" },
  { id: "wide", value: 16, previewClassName: "h-2" },
];
export const DEFAULT_STROKE_SIZE: DrawingStrokeSize = DRAWING_STROKE_SIZES[0] ?? {
  id: "thin",
  value: 3,
  previewClassName: "h-0.5",
};

export type DrawingClientPoint = { clientX: number; clientY: number };


export const TOOL_BUTTON_BASE_CLASS =
  "pbp-interactive-button inline-flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";
export const MOBILE_TOOL_BUTTON_BASE_CLASS =
  "pbp-interactive-button inline-flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";
export const TOOL_BUTTON_ACTIVE_CLASS = "pbp-action-primary border-[var(--pbp-accent)] shadow-sm";
export const TOOL_BUTTON_INACTIVE_CLASS = "pbp-action-secondary border-[var(--pbp-border)]";
export const TOOL_BUTTON_DISABLED_CLASS = "border-[var(--pbp-border-soft)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]";
export const PICKER_PANEL_CLASS =
  "absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] p-2 shadow-xl";
export const TOOLBAR_GROUP_CLASS =
  "flex items-center gap-1.5 rounded-2xl border border-[var(--pbp-border-soft)] bg-[var(--pbp-surface)] p-1.5 shadow-sm";

export function isShapeTool(tool: DrawingTool) {
  return tool === "line" || tool === "arrow" || tool === "rectangle" || tool === "ellipse";
}


export function isColorEnabled(tool: DrawingTool) {
  return tool !== "eraser";
}

export function getEraserLineWidth(strokeSizeId: DrawingStrokeSizeId) {
  return ERASER_LINE_WIDTH_BY_STROKE_SIZE[strokeSizeId] ?? ERASER_LINE_WIDTH_BY_STROKE_SIZE.regular;
}

export function getCanvasPointFromClientPoint(canvas: HTMLCanvasElement, point: DrawingClientPoint) {
  const rect = canvas.getBoundingClientRect();
  const safeWidth = rect.width || 1;
  const safeHeight = rect.height || 1;
  return {
    x: ((point.clientX - rect.left) / safeWidth) * canvas.width,
    y: ((point.clientY - rect.top) / safeHeight) * canvas.height,
  };
}

export function getPointerPosition(canvas: HTMLCanvasElement, event: DrawingPointerEvent) {
  return getCanvasPointFromClientPoint(canvas, event);
}

export function isPointInsideCanvas(point: DrawingPoint, canvas: HTMLCanvasElement) {
  return point.x >= 0 && point.x <= canvas.width && point.y >= 0 && point.y <= canvas.height;
}

export function getEraserCursor(
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

export function getEraserCursorFromCanvasPoint(
  canvas: HTMLCanvasElement,
  point: DrawingPoint,
  eraserLineWidth: number,
): EraserCursor {
  if (!isPointInsideCanvas(point, canvas)) {
    return { x: 0, y: 0, diameter: 0, visible: false };
  }

  const canvasRect = canvas.getBoundingClientRect();
  return {
    x: (point.x / Math.max(1, canvas.width)) * canvasRect.width,
    y: (point.y / Math.max(1, canvas.height)) * canvasRect.height,
    diameter: Math.max(18, (eraserLineWidth / Math.max(1, canvas.width)) * canvasRect.width),
    visible: true,
  };
}

export function getContainedCanvasDisplaySize(
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


export function getPointDistance(start: DrawingPoint, end: DrawingPoint) {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

export function applyStrokeStyle(
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

export function drawArrowHead(context: CanvasRenderingContext2D, start: DrawingPoint, end: DrawingPoint, strokeSize: number) {
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

export function drawShape(
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

export function createDrawingFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `workorder-drawing-${stamp}.${DRAWING_FILE_EXTENSION}`;
}

export function readDrawingDraftSnapshot(): DrawingDraftSnapshot | null {
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

export function writeDrawingDraftSnapshot(snapshot: string, canvasWidth: number, canvasHeight: number) {
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

export function clearDrawingDraftSnapshot() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DRAWING_DRAFT_STORAGE_KEY);
}

export function persistDrawingDraftSnapshot(canvas: HTMLCanvasElement, blankSnapshot: string) {
  const snapshot = canvas.toDataURL(DRAWING_MIME_TYPE);
  if (!snapshot || snapshot === blankSnapshot) {
    clearDrawingDraftSnapshot();
    return;
  }
  writeDrawingDraftSnapshot(snapshot, canvas.width, canvas.height);
}

export function canRestoreDraftSnapshot(draftSnapshot: DrawingDraftSnapshot, canvas: HTMLCanvasElement) {
  return draftSnapshot.width === canvas.width && draftSnapshot.height === canvas.height;
}

export function drawBlankCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
}

export function restoreCanvasSnapshot(canvas: HTMLCanvasElement, snapshot: string, onRestored?: () => void) {
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


export function getToolButtonClass(active: boolean, disabled = false, compact = false) {
  const baseClassName = compact ? MOBILE_TOOL_BUTTON_BASE_CLASS : TOOL_BUTTON_BASE_CLASS;
  if (disabled) return `${baseClassName} ${TOOL_BUTTON_DISABLED_CLASS}`;
  return `${baseClassName} ${active ? TOOL_BUTTON_ACTIVE_CLASS : TOOL_BUTTON_INACTIVE_CLASS}`;
}

export function DrawingIcon({ name, className = "h-4 w-4" }: { name: DrawingIconName; className?: string }) {
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

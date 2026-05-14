"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  MODAL_CONTENT_BODY_TEXT_CLASS,
  MODAL_CONTENT_MUTED_PANEL_CLASS,
} from "@/components/common/modal/modalContentClassNames";
import { useI18n } from "@/lib/i18n";

type DrawingTool = "pen" | "eraser" | "line" | "arrow" | "rectangle" | "ellipse";
type DrawingLineStyle = "solid" | "dashed";

type WorkOrderDrawingModalProps = {
  open: boolean;
  onClose: () => void;
  onSaveDrawing: (file: File) => void;
  variant?: "desktop" | "tablet" | "mobile";
};

type DrawingColorId = "black" | "red" | "blue" | "green";
type DrawingStrokeSizeId = "thin" | "regular" | "bold" | "wide";
type DrawingLineStyleId = DrawingLineStyle;

type DrawingColor = {
  id: DrawingColorId;
  value: string;
};

type DrawingStrokeSize = {
  id: DrawingStrokeSizeId;
  value: number;
};

type DrawingLineStyleOption = {
  id: DrawingLineStyleId;
  value: DrawingLineStyle;
};

type DrawingPoint = {
  x: number;
  y: number;
};

const DRAWING_MIME_TYPE = "image/png";
const DRAWING_FILE_EXTENSION = "png";
const DEFAULT_CANVAS_WIDTH = 1280;
const DEFAULT_CANVAS_HEIGHT = 900;
const MOBILE_CANVAS_WIDTH = 900;
const MOBILE_CANVAS_HEIGHT = 900;
const MAX_HISTORY_LENGTH = 24;
const ERASER_LINE_WIDTH = 34;
const SHAPE_MIN_DISTANCE = 2;

const DRAWING_COLORS: DrawingColor[] = [
  { id: "black", value: "#111827" },
  { id: "red", value: "#dc2626" },
  { id: "blue", value: "#2563eb" },
  { id: "green", value: "#059669" },
];

const DRAWING_STROKE_SIZES: DrawingStrokeSize[] = [
  { id: "thin", value: 3 },
  { id: "regular", value: 6 },
  { id: "bold", value: 10 },
  { id: "wide", value: 16 },
];

const DRAWING_LINE_STYLES: DrawingLineStyleOption[] = [
  { id: "solid", value: "solid" },
  { id: "dashed", value: "dashed" },
];

const TOOL_BUTTON_BASE_CLASS =
  "pbp-interactive-button inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

function getCanvasSize(variant: WorkOrderDrawingModalProps["variant"]) {
  if (variant === "mobile") {
    return { width: MOBILE_CANVAS_WIDTH, height: MOBILE_CANVAS_HEIGHT };
  }
  return { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };
}

function isShapeTool(tool: DrawingTool) {
  return tool === "line" || tool === "arrow" || tool === "rectangle" || tool === "ellipse";
}

function getPointerPosition(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
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
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    context.restore();
    onRestored?.();
  };
  image.src = snapshot;
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
  const drawingRef = useRef(false);
  const strokeDirtyRef = useRef(false);
  const lastPointRef = useRef<DrawingPoint | null>(null);
  const shapeStartPointRef = useRef<DrawingPoint | null>(null);
  const shapeBaseImageDataRef = useRef<ImageData | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const blankSnapshotRef = useRef("");
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [strokeColor, setStrokeColor] = useState(DRAWING_COLORS[0]?.value ?? "#111827");
  const [strokeSize, setStrokeSize] = useState(variant === "mobile" ? 6 : 3);
  const [lineStyle, setLineStyle] = useState<DrawingLineStyle>("solid");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasSize = getCanvasSize(variant);
  const isMobile = variant === "mobile";
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyRef.current.length - 1;

  const syncHistoryState = (nextIndex: number) => {
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    const currentSnapshot = historyRef.current[nextIndex] ?? "";
    setDirty(Boolean(currentSnapshot && currentSnapshot !== blankSnapshotRef.current));
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
  };

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    drawBlankCanvas(canvas);
    const blankSnapshot = canvas.toDataURL(DRAWING_MIME_TYPE);
    blankSnapshotRef.current = blankSnapshot;
    historyRef.current = [blankSnapshot];
    historyIndexRef.current = 0;
    setHistoryIndex(0);
    setDirty(false);
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
  }, [canvasSize.height, canvasSize.width, isMobile, open]);

  const drawFreehandLine = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const nextPoint = getPointerPosition(canvas, event);
    const previousPoint = lastPointRef.current ?? nextPoint;

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = tool === "eraser" ? ERASER_LINE_WIDTH : strokeSize;
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

  const drawShapePreview = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current || !isShapeTool(tool)) return;
    const context = canvas.getContext("2d");
    const startPoint = shapeStartPointRef.current;
    const baseImageData = shapeBaseImageDataRef.current;
    if (!context || !startPoint || !baseImageData) return;
    const nextPoint = getPointerPosition(canvas, event);

    context.putImageData(baseImageData, 0, 0);
    if (getPointDistance(startPoint, nextPoint) < SHAPE_MIN_DISTANCE) return;
    drawShape(context, tool, startPoint, nextPoint, strokeColor, strokeSize, lineStyle);
    strokeDirtyRef.current = true;
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
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
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokeDirtyRef.current = false;
    const startPoint = getPointerPosition(canvas, event);
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
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
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
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;
    const nextIndex = historyIndexRef.current - 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;
    restoreCanvasSnapshot(canvas, snapshot, () => syncHistoryState(nextIndex));
  };

  const handleRedo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    const nextIndex = historyIndexRef.current + 1;
    const snapshot = historyRef.current[nextIndex];
    if (!snapshot) return;
    restoreCanvasSnapshot(canvas, snapshot, () => syncHistoryState(nextIndex));
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBlankCanvas(canvas);
    pushHistorySnapshot();
    setDirty(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || saving) return;
    setSaving(true);
    canvas.toBlob((blob) => {
      if (!blob) {
        setSaving(false);
        return;
      }
      const file = new File([blob], createDrawingFileName(), { type: DRAWING_MIME_TYPE });
      onSaveDrawing(file);
      setSaving(false);
      onClose();
    }, DRAWING_MIME_TYPE);
  };

  return (
    <ModalShell
      open={open}
      title={ui.title}
      description={isMobile ? ui.mobileDescription : ui.description}
      onClose={onClose}
      maxWidthClass="md:max-w-6xl"
      bodyClassName="min-h-0"
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--pbp-text-muted)]">{isMobile ? ui.mobileHint : ui.hint}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="pbp-interactive-button pbp-action-secondary rounded-full px-4 py-2 text-sm font-semibold"
            >
              {ui.clear}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="pbp-interactive-button pbp-action-primary rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? ui.saving : ui.save}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid min-h-0 gap-3 lg:grid-cols-[210px_minmax(0,1fr)]">
        <div className={`${MODAL_CONTENT_MUTED_PANEL_CLASS} flex flex-col gap-3`}>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {([
              ["pen", ui.pen],
              ["eraser", ui.eraser],
              ["line", ui.line],
              ["arrow", ui.arrow],
              ["rectangle", ui.rectangle],
              ["ellipse", ui.ellipse],
            ] as const).map(([toolId, label]) => (
              <button
                key={toolId}
                type="button"
                onClick={() => setTool(toolId)}
                className={`${TOOL_BUTTON_BASE_CLASS} ${tool === toolId ? "pbp-action-primary" : "pbp-action-secondary"}`}
                aria-pressed={tool === toolId}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" aria-label={ui.colorGroupAria}>
            {DRAWING_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setStrokeColor(color.value)}
                className={`h-8 w-8 rounded-full border shadow-sm transition ${strokeColor === color.value ? "ring-2 ring-[var(--pbp-accent)] ring-offset-2 ring-offset-[var(--pbp-surface)]" : "border-[var(--pbp-border)]"}`}
                style={{ backgroundColor: color.value }}
                aria-label={ui.colorLabels[color.id] ?? color.id}
                aria-pressed={strokeColor === color.value}
              />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-2" aria-label={ui.strokeSizeGroupAria}>
            {DRAWING_STROKE_SIZES.map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => setStrokeSize(size.value)}
                className={`${TOOL_BUTTON_BASE_CLASS} px-2 ${strokeSize === size.value ? "pbp-action-primary" : "pbp-action-secondary"}`}
                aria-label={ui.strokeSizeLabels[size.id] ?? size.id}
                aria-pressed={strokeSize === size.value}
              >
                {ui.strokeSizeLabels[size.id] ?? size.id}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2" aria-label={ui.lineStyleGroupAria}>
            {DRAWING_LINE_STYLES.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setLineStyle(option.value)}
                className={`${TOOL_BUTTON_BASE_CLASS} ${lineStyle === option.value ? "pbp-action-primary" : "pbp-action-secondary"}`}
                aria-pressed={lineStyle === option.value}
              >
                {ui.lineStyleLabels[option.id] ?? option.id}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className={`${TOOL_BUTTON_BASE_CLASS} pbp-action-secondary`}
            >
              {ui.undo}
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className={`${TOOL_BUTTON_BASE_CLASS} pbp-action-secondary`}
            >
              {ui.redo}
            </button>
          </div>
          {isMobile ? <p className={`${MODAL_CONTENT_BODY_TEXT_CLASS} leading-6`}>{ui.mobileToolHelp}</p> : <p className={`${MODAL_CONTENT_BODY_TEXT_CLASS} hidden leading-6 lg:block`}>{ui.toolHelp}</p>}
        </div>
        <div className="min-h-0 rounded-3xl border bg-[var(--pbp-surface-muted)] p-2 shadow-inner sm:p-3">
          <div className="h-[56dvh] min-h-[360px] overflow-hidden rounded-2xl border bg-white touch-none sm:h-[62dvh]">
            <canvas
              ref={canvasRef}
              className="h-full w-full cursor-crosshair touch-none select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={(event) => {
                if (drawingRef.current) stopDrawing(event);
              }}
              aria-label={ui.canvasAria}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

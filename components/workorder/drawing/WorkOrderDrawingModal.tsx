"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  MODAL_CONTENT_BODY_TEXT_CLASS,
  MODAL_CONTENT_MUTED_PANEL_CLASS,
} from "@/components/common/modal/modalContentClassNames";
import { useI18n } from "@/lib/i18n";

type DrawingTool = "pen" | "eraser";

type WorkOrderDrawingModalProps = {
  open: boolean;
  onClose: () => void;
  onSaveDrawing: (file: File) => void;
  variant?: "desktop" | "tablet" | "mobile";
};

const DRAWING_MIME_TYPE = "image/png";
const DRAWING_FILE_EXTENSION = "png";
const DEFAULT_CANVAS_WIDTH = 1280;
const DEFAULT_CANVAS_HEIGHT = 900;
const MOBILE_CANVAS_WIDTH = 900;
const MOBILE_CANVAS_HEIGHT = 900;

const TOOL_BUTTON_BASE_CLASS =
  "pbp-interactive-button inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

function getCanvasSize(variant: WorkOrderDrawingModalProps["variant"]) {
  if (variant === "mobile") {
    return { width: MOBILE_CANVAS_WIDTH, height: MOBILE_CANVAS_HEIGHT };
  }
  return { width: DEFAULT_CANVAS_WIDTH, height: DEFAULT_CANVAS_HEIGHT };
}

function getPointerPosition(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
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
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasSize = getCanvasSize(variant);
  const isMobile = variant === "mobile";

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    drawBlankCanvas(canvas);
    setDirty(false);
    setSaving(false);
    drawingRef.current = false;
    lastPointRef.current = null;
  }, [canvasSize.height, canvasSize.width, open]);

  const drawLine = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawingRef.current) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const nextPoint = getPointerPosition(canvas, event);
    const previousPoint = lastPointRef.current ?? nextPoint;

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = tool === "eraser" ? 34 : isMobile ? 7 : 5;
    context.strokeStyle = tool === "eraser" ? "#ffffff" : "#111827";
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
    context.restore();

    lastPointRef.current = nextPoint;
    setDirty(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPointerPosition(canvas, event);
    drawLine(event);
  };

  const stopDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawBlankCanvas(canvas);
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
      <div className="grid min-h-0 gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div className={`${MODAL_CONTENT_MUTED_PANEL_CLASS} flex flex-row gap-2 lg:flex-col`}>
          <button
            type="button"
            onClick={() => setTool("pen")}
            className={`${TOOL_BUTTON_BASE_CLASS} ${tool === "pen" ? "pbp-action-primary" : "pbp-action-secondary"}`}
            aria-pressed={tool === "pen"}
          >
            {ui.pen}
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            className={`${TOOL_BUTTON_BASE_CLASS} ${tool === "eraser" ? "pbp-action-primary" : "pbp-action-secondary"}`}
            aria-pressed={tool === "eraser"}
          >
            {ui.eraser}
          </button>
          <p className={`${MODAL_CONTENT_BODY_TEXT_CLASS} hidden leading-6 lg:block`}>{ui.toolHelp}</p>
        </div>
        <div className="min-h-0 rounded-3xl border bg-[var(--pbp-surface-muted)] p-2 shadow-inner sm:p-3">
          <div className="h-[56dvh] min-h-[360px] overflow-hidden rounded-2xl border bg-white touch-none sm:h-[62dvh]">
            <canvas
              ref={canvasRef}
              className="h-full w-full cursor-crosshair touch-none select-none"
              onPointerDown={handlePointerDown}
              onPointerMove={drawLine}
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

export function resolveDrawingEraserCursorScreenRadius(
  worldTolerance: number,
  viewportScale: number,
  minimumScreenRadius: number,
) {
  if (!Number.isFinite(worldTolerance) || worldTolerance < 0) throw new Error("worldTolerance must be finite and non-negative");
  if (!Number.isFinite(viewportScale) || viewportScale <= 0) throw new Error("viewportScale must be finite and positive");
  if (!Number.isFinite(minimumScreenRadius) || minimumScreenRadius < 0) throw new Error("minimumScreenRadius must be finite and non-negative");
  return Math.max(worldTolerance * viewportScale, minimumScreenRadius);
}

export const DRAWING_ERASER_TOUCH_RADIUS_RATIO = 0.7;

export function resolveDrawingEraserScreenRadius(minimumTouchSize: number) {
  if (!Number.isFinite(minimumTouchSize) || minimumTouchSize <= 0) {
    throw new Error("minimumTouchSize must be finite and positive");
  }
  return minimumTouchSize * DRAWING_ERASER_TOUCH_RADIUS_RATIO;
}

export function resolveDrawingEraserWorldRadius(screenRadius: number, viewportScale: number) {
  if (!Number.isFinite(screenRadius) || screenRadius < 0) {
    throw new Error("screenRadius must be finite and non-negative");
  }
  if (!Number.isFinite(viewportScale) || viewportScale <= 0) {
    throw new Error("viewportScale must be finite and positive");
  }
  return screenRadius / viewportScale;
}

import {
  DRAWING_CANONICAL_CANVAS,
  type DrawingCamera,
  type DrawingPoint,
  type DrawingViewport,
  type DrawingViewportTransform,
} from "./contracts";

function requireFinite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
  return value;
}

export function createDrawingCamera(
  input: Partial<DrawingCamera> = {},
): DrawingCamera {
  const centerX = requireFinite(input.centerX ?? DRAWING_CANONICAL_CANVAS.width / 2, "camera.centerX");
  const centerY = requireFinite(input.centerY ?? DRAWING_CANONICAL_CANVAS.height / 2, "camera.centerY");
  const zoom = requireFinite(input.zoom ?? 1, "camera.zoom");
  if (zoom <= 0) throw new RangeError("camera.zoom must be positive.");
  return Object.freeze({ centerX, centerY, zoom });
}

export function resolveDrawingViewportTransform(
  camera: DrawingCamera,
  viewport: DrawingViewport,
): DrawingViewportTransform {
  const width = requireFinite(viewport.width, "viewport.width");
  const height = requireFinite(viewport.height, "viewport.height");
  if (width <= 0 || height <= 0) throw new RangeError("Drawing viewport dimensions must be positive.");
  const validCamera = createDrawingCamera(camera);
  const fitScale = Math.min(
    width / DRAWING_CANONICAL_CANVAS.width,
    height / DRAWING_CANONICAL_CANVAS.height,
  );
  const scale = fitScale * validCamera.zoom;
  return Object.freeze({
    fitScale,
    scale,
    offsetX: width / 2 - validCamera.centerX * scale,
    offsetY: height / 2 - validCamera.centerY * scale,
  });
}

export function worldToScreen(
  point: DrawingPoint,
  camera: DrawingCamera,
  viewport: DrawingViewport,
): DrawingPoint {
  const x = requireFinite(point.x, "point.x");
  const y = requireFinite(point.y, "point.y");
  const transform = resolveDrawingViewportTransform(camera, viewport);
  return Object.freeze({
    x: x * transform.scale + transform.offsetX,
    y: y * transform.scale + transform.offsetY,
  });
}

export function screenToWorld(
  point: DrawingPoint,
  camera: DrawingCamera,
  viewport: DrawingViewport,
): DrawingPoint {
  const x = requireFinite(point.x, "point.x");
  const y = requireFinite(point.y, "point.y");
  const transform = resolveDrawingViewportTransform(camera, viewport);
  return Object.freeze({
    x: (x - transform.offsetX) / transform.scale,
    y: (y - transform.offsetY) / transform.scale,
  });
}

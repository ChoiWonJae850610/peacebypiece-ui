import {
  DRAWING_CANONICAL_CANVAS,
  type DrawingBounds,
  type DrawingElement,
  type DrawingPoint,
  type DrawingViewportTransform,
} from "./contracts";
import {
  DRAWING_ACTIVE_SEGMENT_MIN_WORLD_LENGTH,
  DRAWING_ACTIVE_SHAPE_MIN_WORLD_SIZE,
} from "./authoring";

export type DrawingSelectionHandleKind =
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left"
  | "start"
  | "end";

export type DrawingSelectionHandle = Readonly<{
  anchor: DrawingPoint;
  kind: DrawingSelectionHandleKind;
  role: "resize" | "endpoint";
}>;

export type DrawingSelectionHandleHit = Readonly<{
  handle: DrawingSelectionHandle;
  screenAnchor: DrawingPoint;
  screenDistance: number;
}>;

export type DrawingSelectionTransform = Readonly<{
  changed: boolean;
  element: DrawingElement;
  fixedAnchor: DrawingPoint;
  handle: DrawingSelectionHandleKind;
}>;

const SHAPE_HANDLES = Object.freeze([
  "top-left",
  "top-right",
  "bottom-right",
  "bottom-left",
] as const);

function requireFinitePoint(point: DrawingPoint, name: string): DrawingPoint {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${name} must contain finite coordinates.`);
  }
  return point;
}

function freezePoint(point: DrawingPoint): DrawingPoint {
  return Object.freeze({ x: point.x, y: point.y });
}

function clampPoint(point: DrawingPoint): DrawingPoint {
  requireFinitePoint(point, "pointerWorld");
  return freezePoint({
    x: Math.max(0, Math.min(DRAWING_CANONICAL_CANVAS.width, point.x)),
    y: Math.max(0, Math.min(DRAWING_CANONICAL_CANVAS.height, point.y)),
  });
}

function shapeCorner(bounds: DrawingBounds, kind: (typeof SHAPE_HANDLES)[number]): DrawingPoint {
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;
  if (kind === "top-left") return freezePoint({ x: bounds.x, y: bounds.y });
  if (kind === "top-right") return freezePoint({ x: right, y: bounds.y });
  if (kind === "bottom-right") return freezePoint({ x: right, y: bottom });
  return freezePoint({ x: bounds.x, y: bottom });
}

function oppositeShapeCorner(kind: (typeof SHAPE_HANDLES)[number]): (typeof SHAPE_HANDLES)[number] {
  if (kind === "top-left") return "bottom-right";
  if (kind === "top-right") return "bottom-left";
  if (kind === "bottom-right") return "top-left";
  return "top-right";
}

export function resolveDrawingSelectionHandles(
  element: DrawingElement,
): readonly DrawingSelectionHandle[] {
  if (element.kind === "rectangle" || element.kind === "ellipse") {
    return Object.freeze(SHAPE_HANDLES.map((kind) => Object.freeze({
      anchor: shapeCorner(element.bounds, kind),
      kind,
      role: "resize" as const,
    })));
  }
  if (element.kind === "line" || element.kind === "arrow") {
    return Object.freeze([
      Object.freeze({ anchor: freezePoint(element.start), kind: "start" as const, role: "endpoint" as const }),
      Object.freeze({ anchor: freezePoint(element.end), kind: "end" as const, role: "endpoint" as const }),
    ]);
  }
  return Object.freeze([]);
}

export function projectDrawingSelectionHandleToScreen(
  handle: DrawingSelectionHandle,
  transform: DrawingViewportTransform,
): DrawingPoint {
  if (!Number.isFinite(transform.scale) || transform.scale <= 0) {
    throw new RangeError("Drawing viewport transform scale must be finite and positive.");
  }
  return freezePoint({
    x: handle.anchor.x * transform.scale + transform.offsetX,
    y: handle.anchor.y * transform.scale + transform.offsetY,
  });
}

export function hitTestDrawingSelectionHandlesScreen(input: Readonly<{
  handles: readonly DrawingSelectionHandle[];
  point: DrawingPoint;
  screenRadius: number;
  transform: DrawingViewportTransform;
}>): DrawingSelectionHandleHit | null {
  requireFinitePoint(input.point, "screenPoint");
  if (!Number.isFinite(input.screenRadius) || input.screenRadius < 0) {
    throw new RangeError("Selection handle screen radius must be finite and non-negative.");
  }
  let closest: DrawingSelectionHandleHit | null = null;
  for (const handle of input.handles) {
    const screenAnchor = projectDrawingSelectionHandleToScreen(handle, input.transform);
    const screenDistance = Math.hypot(
      input.point.x - screenAnchor.x,
      input.point.y - screenAnchor.y,
    );
    if (screenDistance > input.screenRadius) continue;
    if (closest === null || screenDistance < closest.screenDistance) {
      closest = Object.freeze({ handle, screenAnchor, screenDistance });
    }
  }
  return closest;
}

function resizeShape(
  element: Extract<DrawingElement, Readonly<{ kind: "rectangle" | "ellipse" }>>,
  handle: Extract<DrawingSelectionHandleKind, "top-left" | "top-right" | "bottom-right" | "bottom-left">,
  pointerWorld: DrawingPoint,
  minimumWorldSize: number,
): DrawingSelectionTransform {
  if (!Number.isFinite(minimumWorldSize) || minimumWorldSize <= 0) {
    throw new RangeError("Drawing minimum shape size must be finite and positive.");
  }
  const pointer = clampPoint(pointerWorld);
  const fixedAnchor = shapeCorner(element.bounds, oppositeShapeCorner(handle));
  let x: number;
  let y: number;
  let width: number;
  let height: number;
  if (handle === "top-left") {
    x = Math.min(pointer.x, fixedAnchor.x - minimumWorldSize);
    y = Math.min(pointer.y, fixedAnchor.y - minimumWorldSize);
    width = fixedAnchor.x - x;
    height = fixedAnchor.y - y;
  } else if (handle === "top-right") {
    const right = Math.max(pointer.x, fixedAnchor.x + minimumWorldSize);
    y = Math.min(pointer.y, fixedAnchor.y - minimumWorldSize);
    x = fixedAnchor.x;
    width = right - fixedAnchor.x;
    height = fixedAnchor.y - y;
  } else if (handle === "bottom-right") {
    const right = Math.max(pointer.x, fixedAnchor.x + minimumWorldSize);
    const bottom = Math.max(pointer.y, fixedAnchor.y + minimumWorldSize);
    x = fixedAnchor.x;
    y = fixedAnchor.y;
    width = right - fixedAnchor.x;
    height = bottom - fixedAnchor.y;
  } else {
    x = Math.min(pointer.x, fixedAnchor.x - minimumWorldSize);
    const bottom = Math.max(pointer.y, fixedAnchor.y + minimumWorldSize);
    y = fixedAnchor.y;
    width = fixedAnchor.x - x;
    height = bottom - fixedAnchor.y;
  }
  const bounds = Object.freeze({ x, y, width, height });
  const changed = bounds.x !== element.bounds.x
    || bounds.y !== element.bounds.y
    || bounds.width !== element.bounds.width
    || bounds.height !== element.bounds.height;
  return Object.freeze({
    changed,
    element: changed ? Object.freeze({ ...element, bounds }) : element,
    fixedAnchor,
    handle,
  });
}

function editSegmentEndpoint(
  element: Extract<DrawingElement, Readonly<{ kind: "line" | "arrow" }>>,
  handle: Extract<DrawingSelectionHandleKind, "start" | "end">,
  pointerWorld: DrawingPoint,
  minimumWorldLength: number,
): DrawingSelectionTransform {
  if (!Number.isFinite(minimumWorldLength) || minimumWorldLength <= 0) {
    throw new RangeError("Drawing minimum segment length must be finite and positive.");
  }
  const pointer = clampPoint(pointerWorld);
  const fixedAnchor = freezePoint(handle === "start" ? element.end : element.start);
  const baseDragged = handle === "start" ? element.start : element.end;
  const requestedDx = pointer.x - fixedAnchor.x;
  const requestedDy = pointer.y - fixedAnchor.y;
  const requestedLength = Math.hypot(requestedDx, requestedDy);
  let dragged = pointer;
  if (requestedLength < minimumWorldLength) {
    const baseDx = baseDragged.x - fixedAnchor.x;
    const baseDy = baseDragged.y - fixedAnchor.y;
    const baseLength = Math.hypot(baseDx, baseDy);
    const directionX = baseLength > 0 ? baseDx / baseLength : 1;
    const directionY = baseLength > 0 ? baseDy / baseLength : 0;
    const preferred = freezePoint({
      x: fixedAnchor.x + directionX * minimumWorldLength,
      y: fixedAnchor.y + directionY * minimumWorldLength,
    });
    const preferredInside = preferred.x >= 0
      && preferred.x <= DRAWING_CANONICAL_CANVAS.width
      && preferred.y >= 0
      && preferred.y <= DRAWING_CANONICAL_CANVAS.height;
    if (preferredInside) {
      dragged = preferred;
    } else {
      const safeDirections = [
        freezePoint({ x: minimumWorldLength, y: 0 }),
        freezePoint({ x: -minimumWorldLength, y: 0 }),
        freezePoint({ x: 0, y: minimumWorldLength }),
        freezePoint({ x: 0, y: -minimumWorldLength }),
      ];
      const safeDirection = safeDirections.find((direction) => (
        fixedAnchor.x + direction.x >= 0
        && fixedAnchor.x + direction.x <= DRAWING_CANONICAL_CANVAS.width
        && fixedAnchor.y + direction.y >= 0
        && fixedAnchor.y + direction.y <= DRAWING_CANONICAL_CANVAS.height
      ));
      if (safeDirection === undefined) {
        throw new RangeError("Canonical canvas cannot contain the minimum segment length.");
      }
      dragged = freezePoint({
        x: fixedAnchor.x + safeDirection.x,
        y: fixedAnchor.y + safeDirection.y,
      });
    }
  }
  const start = handle === "start" ? dragged : element.start;
  const end = handle === "end" ? dragged : element.end;
  const changed = start.x !== element.start.x
    || start.y !== element.start.y
    || end.x !== element.end.x
    || end.y !== element.end.y;
  return Object.freeze({
    changed,
    element: changed ? Object.freeze({ ...element, start: freezePoint(start), end: freezePoint(end) }) : element,
    fixedAnchor,
    handle,
  });
}

export function resolveDrawingSelectionHandleTransform(input: Readonly<{
  element: DrawingElement;
  handle: DrawingSelectionHandleKind;
  minimumSegmentWorldLength?: number;
  minimumShapeWorldSize?: number;
  pointerWorld: DrawingPoint;
}>): DrawingSelectionTransform | null {
  if (input.element.kind === "rectangle" || input.element.kind === "ellipse") {
    if (!SHAPE_HANDLES.includes(input.handle as (typeof SHAPE_HANDLES)[number])) return null;
    return resizeShape(
      input.element,
      input.handle as (typeof SHAPE_HANDLES)[number],
      input.pointerWorld,
      input.minimumShapeWorldSize ?? DRAWING_ACTIVE_SHAPE_MIN_WORLD_SIZE,
    );
  }
  if (input.element.kind === "line" || input.element.kind === "arrow") {
    if (input.handle !== "start" && input.handle !== "end") return null;
    return editSegmentEndpoint(
      input.element,
      input.handle,
      input.pointerWorld,
      input.minimumSegmentWorldLength ?? DRAWING_ACTIVE_SEGMENT_MIN_WORLD_LENGTH,
    );
  }
  return null;
}

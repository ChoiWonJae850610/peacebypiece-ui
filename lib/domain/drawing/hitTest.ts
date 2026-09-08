import {
  type DrawingBounds,
  type DrawingElement,
  type DrawingPoint,
  type DrawingSceneV1,
} from "./contracts";

export const DRAWING_HIT_TEST_TOLERANCE_WORLD = 12;
export const DRAWING_SELECTION_OUTLINE_PADDING_WORLD = 8;

type DrawingArrowHeadWorldGeometry = Readonly<{
  left: DrawingPoint;
  right: DrawingPoint;
  tip: DrawingPoint;
}>;

function freezePoint(point: DrawingPoint): DrawingPoint {
  return Object.freeze({ x: point.x, y: point.y });
}

function assertTolerance(tolerance: number): number {
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new RangeError("Drawing hit-test tolerance must be finite and non-negative.");
  }
  return tolerance;
}

export function distanceFromDrawingPointToSegment(
  point: DrawingPoint,
  start: DrawingPoint,
  end: DrawingPoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = Math.max(0, Math.min(1,
    ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
  ));
  const closestX = start.x + projection * dx;
  const closestY = start.y + projection * dy;
  return Math.hypot(point.x - closestX, point.y - closestY);
}

export function resolveDrawingArrowHeadWorldGeometry(
  start: DrawingPoint,
  end: DrawingPoint,
  strokeWidth: number,
): DrawingArrowHeadWorldGeometry {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = Math.max(30, strokeWidth * 4);
  return Object.freeze({
    left: freezePoint({
      x: end.x - headLength * Math.cos(angle - Math.PI / 6),
      y: end.y - headLength * Math.sin(angle - Math.PI / 6),
    }),
    right: freezePoint({
      x: end.x - headLength * Math.cos(angle + Math.PI / 6),
      y: end.y - headLength * Math.sin(angle + Math.PI / 6),
    }),
    tip: freezePoint(end),
  });
}

function drawingTextCharacterWidth(character: string, fontSize: number): number {
  if (/\s/u.test(character)) return fontSize * 0.35;
  return character.codePointAt(0)! <= 0x7f ? fontSize * 0.62 : fontSize;
}

export function resolveDrawingTextSemanticBounds(
  element: Extract<DrawingElement, Readonly<{ kind: "text" }>>,
): DrawingBounds {
  const width = Array.from(element.content).reduce(
    (total, character) => total + drawingTextCharacterWidth(character, element.fontSize),
    0,
  );
  return Object.freeze({
    x: element.anchor.x,
    y: element.anchor.y - element.fontSize * 0.9,
    width: Math.max(element.fontSize * 0.35, width),
    height: element.fontSize * 1.1,
  });
}

function boundsFromPoints(points: readonly DrawingPoint[], padding: number): DrawingBounds {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;
  return Object.freeze({ x: minX, y: minY, width: maxX - minX, height: maxY - minY });
}

export function resolveDrawingElementWorldBounds(
  element: DrawingElement,
  padding = 0,
): DrawingBounds {
  assertTolerance(padding);
  if (element.kind === "freehand") return boundsFromPoints(element.points, padding);
  if (element.kind === "line") return boundsFromPoints([element.start, element.end], padding);
  if (element.kind === "arrow") {
    const head = resolveDrawingArrowHeadWorldGeometry(element.start, element.end, element.style.strokeWidth);
    return boundsFromPoints([element.start, head.left, head.tip, head.right], padding);
  }
  if (element.kind === "text") {
    const bounds = resolveDrawingTextSemanticBounds(element);
    return Object.freeze({
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
    });
  }
  return Object.freeze({
    x: element.bounds.x - padding,
    y: element.bounds.y - padding,
    width: element.bounds.width + padding * 2,
    height: element.bounds.height + padding * 2,
  });
}

function isPointInsideBounds(point: DrawingPoint, bounds: DrawingBounds, tolerance: number): boolean {
  return point.x >= bounds.x - tolerance
    && point.x <= bounds.x + bounds.width + tolerance
    && point.y >= bounds.y - tolerance
    && point.y <= bounds.y + bounds.height + tolerance;
}

function hitPolyline(
  point: DrawingPoint,
  points: readonly DrawingPoint[],
  tolerance: number,
): boolean {
  for (let index = 1; index < points.length; index += 1) {
    if (distanceFromDrawingPointToSegment(point, points[index - 1], points[index]) <= tolerance) return true;
  }
  return points.length === 1 && Math.hypot(point.x - points[0].x, point.y - points[0].y) <= tolerance;
}

function hitRectangleBorder(point: DrawingPoint, bounds: DrawingBounds, tolerance: number): boolean {
  if (!isPointInsideBounds(point, bounds, tolerance)) return false;
  const left = Math.abs(point.x - bounds.x);
  const right = Math.abs(point.x - (bounds.x + bounds.width));
  const top = Math.abs(point.y - bounds.y);
  const bottom = Math.abs(point.y - (bounds.y + bounds.height));
  return Math.min(left, right, top, bottom) <= tolerance;
}

function hitEllipseBorder(point: DrawingPoint, bounds: DrawingBounds, tolerance: number): boolean {
  const radiusX = bounds.width / 2;
  const radiusY = bounds.height / 2;
  if (radiusX <= 0 || radiusY <= 0) return false;
  const centerX = bounds.x + radiusX;
  const centerY = bounds.y + radiusY;
  const normalizedRadius = Math.hypot((point.x - centerX) / radiusX, (point.y - centerY) / radiusY);
  const approximateBoundaryDistance = Math.abs(normalizedRadius - 1) * Math.min(radiusX, radiusY);
  return approximateBoundaryDistance <= tolerance;
}

export function hitTestDrawingElement(
  element: DrawingElement,
  point: DrawingPoint,
  tolerance = DRAWING_HIT_TEST_TOLERANCE_WORLD,
): boolean {
  const worldTolerance = assertTolerance(tolerance) + element.style.strokeWidth / 2;
  if (element.kind === "freehand") return hitPolyline(point, element.points, worldTolerance);
  if (element.kind === "line") {
    return distanceFromDrawingPointToSegment(point, element.start, element.end) <= worldTolerance;
  }
  if (element.kind === "arrow") {
    const head = resolveDrawingArrowHeadWorldGeometry(element.start, element.end, element.style.strokeWidth);
    return distanceFromDrawingPointToSegment(point, element.start, element.end) <= worldTolerance
      || distanceFromDrawingPointToSegment(point, head.left, head.tip) <= worldTolerance
      || distanceFromDrawingPointToSegment(point, head.tip, head.right) <= worldTolerance;
  }
  if (element.kind === "text") {
    return isPointInsideBounds(point, resolveDrawingTextSemanticBounds(element), worldTolerance);
  }
  if (element.style.fillColor !== null && isPointInsideBounds(point, element.bounds, 0)) return true;
  if (element.kind === "rectangle") return hitRectangleBorder(point, element.bounds, worldTolerance);
  return hitEllipseBorder(point, element.bounds, worldTolerance);
}

export function hitTestDrawingSceneTopmost(
  scene: DrawingSceneV1,
  point: DrawingPoint,
  tolerance = DRAWING_HIT_TEST_TOLERANCE_WORLD,
): DrawingElement | null {
  for (let index = scene.elements.length - 1; index >= 0; index -= 1) {
    const element = scene.elements[index];
    if (hitTestDrawingElement(element, point, tolerance)) return element;
  }
  return null;
}

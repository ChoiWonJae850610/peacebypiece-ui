import { DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE } from "./authoring";
import type {
  DrawingElement,
  DrawingPoint,
  DrawingSceneV1,
} from "./contracts";
import {
  DRAWING_HIT_TEST_TOLERANCE_WORLD,
  resolveDrawingArrowHeadWorldGeometry,
} from "./hitTest";
import { createDrawingScene } from "./scene";

export const DRAWING_PARTIAL_ERASER_RADIUS_WORLD = DRAWING_HIT_TEST_TOLERANCE_WORLD;
export const DRAWING_ERASER_FRAGMENT_MIN_WORLD_LENGTH = DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE;

const EPSILON = 1e-7;

type DrawingInterval = Readonly<{ start: number; end: number }>;

export type DrawingFreehandPartialEraseReplacement = Readonly<{
  elementId: string;
  fragments: readonly (readonly DrawingPoint[])[];
}>;

export type DrawingFreehandPartialErasePlan = Readonly<{
  changed: boolean;
  replacements: readonly DrawingFreehandPartialEraseReplacement[];
}>;

export type DrawingFreehandFragmentIdFactory = (
  originalElementId: string,
  fragmentIndex: number,
) => string;

export type DrawingStrokePartialEraseReplacement = DrawingFreehandPartialEraseReplacement;
export type DrawingStrokePartialErasePlan = DrawingFreehandPartialErasePlan;
export type DrawingStrokeFragmentIdFactory = DrawingFreehandFragmentIdFactory;

type DrawingStrokeComponent = Readonly<{
  closed: boolean;
  points: readonly DrawingPoint[];
}>;

const DRAWING_ELLIPSE_FLATTEN_MIN_SEGMENTS = 48;
const DRAWING_ELLIPSE_FLATTEN_MAX_SEGMENTS = 192;
const DRAWING_ELLIPSE_FLATTEN_TARGET_CHORD_WORLD = 12;

function assertRadius(radius: number): number {
  if (!Number.isFinite(radius) || radius < 0) {
    throw new RangeError("Drawing partial-eraser radius must be finite and non-negative.");
  }
  return radius;
}

function freezePoint(point: DrawingPoint): DrawingPoint {
  return Object.freeze({ x: point.x, y: point.y });
}

function pointAt(start: DrawingPoint, end: DrawingPoint, progress: number): DrawingPoint {
  return freezePoint({
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  });
}

function pointsEqual(left: DrawingPoint, right: DrawingPoint): boolean {
  return Math.abs(left.x - right.x) <= EPSILON && Math.abs(left.y - right.y) <= EPSILON;
}

function segmentCircleInterval(
  start: DrawingPoint,
  end: DrawingPoint,
  center: DrawingPoint,
  radius: number,
): DrawingInterval | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const fx = start.x - center.x;
  const fy = start.y - center.y;
  const a = dx * dx + dy * dy;
  if (a <= EPSILON) {
    return Math.hypot(fx, fy) <= radius ? Object.freeze({ start: 0, end: 1 }) : null;
  }
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return c <= 0 ? Object.freeze({ start: 0, end: 1 }) : null;
  }
  const root = Math.sqrt(Math.max(0, discriminant));
  const left = Math.max(0, (-b - root) / (2 * a));
  const right = Math.min(1, (-b + root) / (2 * a));
  return left <= right + EPSILON ? Object.freeze({ start: left, end: right }) : null;
}

function clipLinearRange(
  interval: DrawingInterval,
  initial: number,
  delta: number,
  minimum: number,
  maximum: number,
): DrawingInterval | null {
  if (Math.abs(delta) <= EPSILON) {
    return initial >= minimum - EPSILON && initial <= maximum + EPSILON ? interval : null;
  }
  const first = (minimum - initial) / delta;
  const second = (maximum - initial) / delta;
  const start = Math.max(interval.start, Math.min(first, second));
  const end = Math.min(interval.end, Math.max(first, second));
  return start <= end + EPSILON ? Object.freeze({ start, end }) : null;
}

function segmentCapsuleIntervals(
  strokeStart: DrawingPoint,
  strokeEnd: DrawingPoint,
  trailStart: DrawingPoint,
  trailEnd: DrawingPoint,
  radius: number,
): readonly DrawingInterval[] {
  const trailDx = trailEnd.x - trailStart.x;
  const trailDy = trailEnd.y - trailStart.y;
  const trailLength = Math.hypot(trailDx, trailDy);
  if (trailLength <= EPSILON) {
    const interval = segmentCircleInterval(strokeStart, strokeEnd, trailStart, radius);
    return interval ? Object.freeze([interval]) : Object.freeze([]);
  }

  const axisX = trailDx / trailLength;
  const axisY = trailDy / trailLength;
  const normalX = -axisY;
  const normalY = axisX;
  const strokeDx = strokeEnd.x - strokeStart.x;
  const strokeDy = strokeEnd.y - strokeStart.y;
  const relativeX = strokeStart.x - trailStart.x;
  const relativeY = strokeStart.y - trailStart.y;
  const initialAlong = relativeX * axisX + relativeY * axisY;
  const deltaAlong = strokeDx * axisX + strokeDy * axisY;
  const initialAcross = relativeX * normalX + relativeY * normalY;
  const deltaAcross = strokeDx * normalX + strokeDy * normalY;

  let rectangle: DrawingInterval | null = Object.freeze({ start: 0, end: 1 });
  rectangle = clipLinearRange(rectangle, initialAlong, deltaAlong, 0, trailLength);
  if (rectangle) rectangle = clipLinearRange(rectangle, initialAcross, deltaAcross, -radius, radius);

  return Object.freeze([
    segmentCircleInterval(strokeStart, strokeEnd, trailStart, radius),
    segmentCircleInterval(strokeStart, strokeEnd, trailEnd, radius),
    rectangle,
  ].filter((interval): interval is DrawingInterval => interval !== null));
}

function mergeIntervals(intervals: readonly DrawingInterval[]): readonly DrawingInterval[] {
  if (intervals.length === 0) return Object.freeze([]);
  const sorted = [...intervals]
    .map((interval) => ({ start: Math.max(0, interval.start), end: Math.min(1, interval.end) }))
    .filter((interval) => interval.start <= interval.end + EPSILON)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: { start: number; end: number }[] = [];
  for (const interval of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && interval.start <= previous.end + EPSILON) previous.end = Math.max(previous.end, interval.end);
    else merged.push({ ...interval });
  }
  return Object.freeze(merged.map((interval) => Object.freeze(interval)));
}

function erasedIntervalsForSegment(
  start: DrawingPoint,
  end: DrawingPoint,
  trail: readonly DrawingPoint[],
  radius: number,
): readonly DrawingInterval[] {
  if (trail.length === 0) return Object.freeze([]);
  const intervals: DrawingInterval[] = [];
  if (trail.length === 1) {
    const interval = segmentCircleInterval(start, end, trail[0], radius);
    if (interval) intervals.push(interval);
  } else {
    for (let index = 1; index < trail.length; index += 1) {
      intervals.push(...segmentCapsuleIntervals(start, end, trail[index - 1], trail[index], radius));
    }
  }
  return mergeIntervals(intervals);
}

function outsideIntervals(erased: readonly DrawingInterval[]): readonly DrawingInterval[] {
  if (erased.length === 0) return Object.freeze([Object.freeze({ start: 0, end: 1 })]);
  const outside: DrawingInterval[] = [];
  let cursor = 0;
  for (const interval of erased) {
    if (interval.start > cursor + EPSILON) outside.push(Object.freeze({ start: cursor, end: interval.start }));
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < 1 - EPSILON) outside.push(Object.freeze({ start: cursor, end: 1 }));
  return Object.freeze(outside);
}

function polylineLength(points: readonly DrawingPoint[]): number {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
  }
  return length;
}

function splitStrokePoints(
  points: readonly DrawingPoint[],
  strokeWidth: number,
  trail: readonly DrawingPoint[],
  radius: number,
  minimumFragmentLength: number,
  closed = false,
): Readonly<{ changed: boolean; fragments: readonly (readonly DrawingPoint[])[] }> {
  const fragments: DrawingPoint[][] = [];
  let current: DrawingPoint[] | null = null;
  let changed = false;

  const finishCurrent = () => {
    if (current && current.length >= 2 && polylineLength(current) >= minimumFragmentLength - EPSILON) {
      fragments.push(current);
    }
    current = null;
  };

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    const erased = erasedIntervalsForSegment(start, end, trail, radius + strokeWidth / 2);
    if (erased.length > 0) changed = true;
    const outside = outsideIntervals(erased);
    if (outside.length === 0) {
      finishCurrent();
      continue;
    }
    for (const interval of outside) {
      const intervalStart = pointAt(start, end, interval.start);
      const intervalEnd = pointAt(start, end, interval.end);
      const canContinue = interval.start <= EPSILON
        && current !== null
        && pointsEqual(current[current.length - 1], intervalStart);
      if (!canContinue) {
        finishCurrent();
        current = [intervalStart];
      }
      const activeFragment: DrawingPoint[] = current === null ? [intervalStart] : current;
      current = activeFragment;
      if (!pointsEqual(activeFragment[activeFragment.length - 1], intervalEnd)) activeFragment.push(intervalEnd);
      if (interval.end < 1 - EPSILON) finishCurrent();
    }
  }
  finishCurrent();

  if (!changed) return Object.freeze({ changed: false, fragments: Object.freeze([points]) });
  if (closed && fragments.length > 1) {
    const first = fragments[0];
    const last = fragments[fragments.length - 1];
    const seam = points[0];
    if (pointsEqual(first[0], seam) && pointsEqual(last[last.length - 1], seam)) {
      fragments.splice(0, 1);
      fragments.pop();
      fragments.unshift([...last, ...first.slice(1)]);
    }
  }
  return Object.freeze({
    changed: true,
    fragments: Object.freeze(fragments.map((fragment) => Object.freeze(fragment.map(freezePoint)))),
  });
}

function freezeComponent(points: readonly DrawingPoint[], closed = false): DrawingStrokeComponent {
  return Object.freeze({ closed, points: Object.freeze(points.map(freezePoint)) });
}

function rectangleStrokeComponents(element: Extract<DrawingElement, Readonly<{ kind: "rectangle" }>>): readonly DrawingStrokeComponent[] {
  const { x, y, width, height } = element.bounds;
  const topLeft = freezePoint({ x, y });
  const topRight = freezePoint({ x: x + width, y });
  const bottomRight = freezePoint({ x: x + width, y: y + height });
  const bottomLeft = freezePoint({ x, y: y + height });
  return Object.freeze([
    freezeComponent([topLeft, topRight]),
    freezeComponent([topRight, bottomRight]),
    freezeComponent([bottomRight, bottomLeft]),
    freezeComponent([bottomLeft, topLeft]),
  ]);
}

function ellipseStrokeComponent(element: Extract<DrawingElement, Readonly<{ kind: "ellipse" }>>): DrawingStrokeComponent {
  const radiusX = element.bounds.width / 2;
  const radiusY = element.bounds.height / 2;
  const centerX = element.bounds.x + radiusX;
  const centerY = element.bounds.y + radiusY;
  const circumference = Math.PI * (3 * (radiusX + radiusY) - Math.sqrt(
    Math.max(0, (3 * radiusX + radiusY) * (radiusX + 3 * radiusY)),
  ));
  const segmentCount = Math.max(
    DRAWING_ELLIPSE_FLATTEN_MIN_SEGMENTS,
    Math.min(DRAWING_ELLIPSE_FLATTEN_MAX_SEGMENTS, Math.ceil(circumference / DRAWING_ELLIPSE_FLATTEN_TARGET_CHORD_WORLD)),
  );
  const points: DrawingPoint[] = [];
  for (let index = 0; index <= segmentCount; index += 1) {
    const angle = -Math.PI / 2 + (index / segmentCount) * Math.PI * 2;
    points.push(freezePoint({
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
    }));
  }
  return freezeComponent(points, true);
}

function resolveDrawingErasableStrokeComponents(element: DrawingElement): readonly DrawingStrokeComponent[] {
  if (element.kind === "text") return Object.freeze([]);
  if ((element.kind === "rectangle" || element.kind === "ellipse") && element.style.fillColor !== null) {
    return Object.freeze([]);
  }
  if (element.kind === "freehand") return Object.freeze([freezeComponent(element.points)]);
  if (element.kind === "line") return Object.freeze([freezeComponent([element.start, element.end])]);
  if (element.kind === "arrow") {
    const head = resolveDrawingArrowHeadWorldGeometry(element.start, element.end, element.style.strokeWidth);
    return Object.freeze([
      freezeComponent([element.start, element.end]),
      freezeComponent([head.left, head.tip]),
      freezeComponent([head.tip, head.right]),
    ]);
  }
  if (element.kind === "rectangle") return rectangleStrokeComponents(element);
  return Object.freeze([ellipseStrokeComponent(element)]);
}

export function planDrawingStrokePartialErase(
  scene: DrawingSceneV1,
  trail: readonly DrawingPoint[],
  options: Readonly<{
    minimumFragmentLength?: number;
    radius: number;
  }>,
): DrawingStrokePartialErasePlan {
  const radius = assertRadius(options.radius);
  const minimumFragmentLength = options.minimumFragmentLength ?? DRAWING_ERASER_FRAGMENT_MIN_WORLD_LENGTH;
  if (!Number.isFinite(minimumFragmentLength) || minimumFragmentLength < 0) {
    throw new RangeError("Drawing eraser fragment minimum length must be finite and non-negative.");
  }
  if (trail.length === 0) return Object.freeze({ changed: false, replacements: Object.freeze([]) });

  const replacements: DrawingStrokePartialEraseReplacement[] = [];
  for (const element of scene.elements) {
    const components = resolveDrawingErasableStrokeComponents(element);
    if (components.length === 0) continue;
    const componentResults = components.map((component) => splitStrokePoints(
      component.points,
      element.style.strokeWidth,
      trail,
      radius,
      minimumFragmentLength,
      component.closed,
    ));
    if (!componentResults.some((result) => result.changed)) continue;
    replacements.push(Object.freeze({
      elementId: element.id,
      fragments: Object.freeze(componentResults.flatMap((result) => result.fragments)),
    }));
  }
  return Object.freeze({ changed: replacements.length > 0, replacements: Object.freeze(replacements) });
}

export function applyDrawingStrokePartialErasePlan(
  scene: DrawingSceneV1,
  plan: DrawingStrokePartialErasePlan,
  createFragmentId: DrawingStrokeFragmentIdFactory,
): DrawingSceneV1 {
  if (!plan.changed) return scene;
  const replacements = new Map(plan.replacements.map((replacement) => [replacement.elementId, replacement]));
  const usedIds = new Set(scene.elements.map((element) => element.id));
  const nextElements = scene.elements.flatMap((element) => {
    const replacement = replacements.get(element.id);
    if (!replacement) return [element];
    return replacement.fragments.map((points, fragmentIndex) => {
      const id = fragmentIndex === 0 ? element.id : createFragmentId(element.id, fragmentIndex);
      if (fragmentIndex > 0 && usedIds.has(id)) throw new Error(`Duplicate Drawing fragment id: ${id}`);
      usedIds.add(id);
      return Object.freeze({ id, kind: "freehand" as const, points, style: element.style });
    });
  });
  return createDrawingScene(nextElements);
}

export function planDrawingFreehandPartialErase(
  scene: DrawingSceneV1,
  trail: readonly DrawingPoint[],
  options: Readonly<{
    minimumFragmentLength?: number;
    radius?: number;
  }> = {},
): DrawingFreehandPartialErasePlan {
  const radius = assertRadius(options.radius ?? DRAWING_PARTIAL_ERASER_RADIUS_WORLD);
  const minimumFragmentLength = options.minimumFragmentLength ?? DRAWING_ERASER_FRAGMENT_MIN_WORLD_LENGTH;
  if (!Number.isFinite(minimumFragmentLength) || minimumFragmentLength < 0) {
    throw new RangeError("Drawing eraser fragment minimum length must be finite and non-negative.");
  }
  if (trail.length === 0) return Object.freeze({ changed: false, replacements: Object.freeze([]) });

  const replacements: DrawingFreehandPartialEraseReplacement[] = [];
  for (const element of scene.elements) {
    if (element.kind !== "freehand") continue;
    const result = splitStrokePoints(element.points, element.style.strokeWidth, trail, radius, minimumFragmentLength);
    if (result.changed) replacements.push(Object.freeze({ elementId: element.id, fragments: result.fragments }));
  }
  return Object.freeze({ changed: replacements.length > 0, replacements: Object.freeze(replacements) });
}

export function applyDrawingFreehandPartialErasePlan(
  scene: DrawingSceneV1,
  plan: DrawingFreehandPartialErasePlan,
  createFragmentId: DrawingFreehandFragmentIdFactory,
): DrawingSceneV1 {
  if (!plan.changed) return scene;
  const replacements = new Map(plan.replacements.map((replacement) => [replacement.elementId, replacement]));
  const usedIds = new Set(scene.elements.map((element) => element.id));
  const nextElements = scene.elements.flatMap((element) => {
    const replacement = replacements.get(element.id);
    if (!replacement || element.kind !== "freehand") return [element];
    return replacement.fragments.map((points, fragmentIndex) => {
      const id = fragmentIndex === 0 ? element.id : createFragmentId(element.id, fragmentIndex);
      if (fragmentIndex > 0 && usedIds.has(id)) throw new Error(`Duplicate Drawing fragment id: ${id}`);
      usedIds.add(id);
      return Object.freeze({ id, kind: "freehand" as const, points, style: element.style });
    });
  });
  return createDrawingScene(nextElements);
}

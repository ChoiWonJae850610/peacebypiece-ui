import {
  DRAWING_TEXT_DEFAULT_FONT_SIZE,
  DRAWING_TEXT_MAX_LENGTH,
  type DrawingArrowElement,
  type DrawingElementStyle,
  type DrawingFreehandElement,
  type DrawingLineElement,
  type DrawingPoint,
  type DrawingTextElement,
} from "./contracts";

export const DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE = 1.5;
export const DRAWING_ACTIVE_SEGMENT_MIN_WORLD_LENGTH = 1.5;

export type DrawingActiveSegment = Readonly<{
  id: string;
  kind: "line" | "arrow";
  start: DrawingPoint;
  end: DrawingPoint;
  style: DrawingElementStyle;
}>;

export type DrawingActiveStroke = Readonly<{
  id: string;
  style: DrawingElementStyle;
  points: readonly DrawingPoint[];
  samplesReceived: number;
  decimatedPoints: number;
}>;

export type DrawingPointGapMetrics = Readonly<{
  averageWorldGap: number;
  maximumWorldGap: number;
  segmentCount: number;
}>;

function freezePoint(point: DrawingPoint): DrawingPoint {
  return Object.freeze({ x: point.x, y: point.y });
}

function freezeStyle(style: DrawingElementStyle): DrawingElementStyle {
  return Object.freeze({
    fillColor: style.fillColor,
    strokeColor: style.strokeColor,
    strokeWidth: style.strokeWidth,
  });
}

function createActiveStroke(
  stroke: Omit<DrawingActiveStroke, "points" | "style"> &
    Readonly<{ points: readonly DrawingPoint[]; style: DrawingElementStyle }>,
): DrawingActiveStroke {
  return Object.freeze({
    ...stroke,
    points: Object.freeze([...stroke.points]),
    style: stroke.style,
  });
}

export function beginDrawingActiveStroke(input: Readonly<{
  id: string;
  point: DrawingPoint;
  style: DrawingElementStyle;
}>): DrawingActiveStroke {
  return createActiveStroke({
    decimatedPoints: 0,
    id: input.id,
    points: [freezePoint(input.point)],
    samplesReceived: 1,
    style: freezeStyle(input.style),
  });
}

export function appendDrawingActiveStrokePoint(
  stroke: DrawingActiveStroke,
  point: DrawingPoint,
  options: Readonly<{
    final?: boolean;
    minimumWorldDistance?: number;
  }> = {},
): DrawingActiveStroke {
  const minimumWorldDistance = options.minimumWorldDistance ?? DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE;
  if (!Number.isFinite(minimumWorldDistance) || minimumWorldDistance < 0) {
    throw new RangeError("Drawing active-stroke minimum distance must be finite and non-negative.");
  }

  const nextPoint = freezePoint(point);
  const lastPoint = stroke.points[stroke.points.length - 1];
  const distance = Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y);
  const finalDotEndpoint = options.final === true && stroke.points.length === 1;
  const shouldAccept = distance >= minimumWorldDistance || (options.final === true && distance > 0) || finalDotEndpoint;

  return createActiveStroke({
    decimatedPoints: stroke.decimatedPoints + (shouldAccept ? 0 : 1),
    id: stroke.id,
    points: shouldAccept ? [...stroke.points, nextPoint] : stroke.points,
    samplesReceived: stroke.samplesReceived + 1,
    style: stroke.style,
  });
}

export function finalizeDrawingActiveStroke(stroke: DrawingActiveStroke): DrawingFreehandElement {
  const points = stroke.points.length >= 2
    ? stroke.points
    : [stroke.points[0], stroke.points[0]];
  return Object.freeze({
    id: stroke.id,
    kind: "freehand",
    points: Object.freeze([...points]),
    style: stroke.style,
  });
}

export function cancelDrawingActiveStroke(): null {
  return null;
}

export function beginDrawingActiveSegment(input: Readonly<{
  id: string;
  kind: "line" | "arrow";
  point: DrawingPoint;
  style: DrawingElementStyle;
}>): DrawingActiveSegment {
  const point = freezePoint(input.point);
  return Object.freeze({
    id: input.id,
    kind: input.kind,
    start: point,
    end: point,
    style: freezeStyle(input.style),
  });
}

export function updateDrawingActiveSegment(
  segment: DrawingActiveSegment,
  point: DrawingPoint,
): DrawingActiveSegment {
  return Object.freeze({ ...segment, end: freezePoint(point) });
}

export function finalizeDrawingActiveSegment(
  segment: DrawingActiveSegment,
  minimumWorldLength = DRAWING_ACTIVE_SEGMENT_MIN_WORLD_LENGTH,
): DrawingLineElement | DrawingArrowElement | null {
  if (!Number.isFinite(minimumWorldLength) || minimumWorldLength < 0) {
    throw new RangeError("Drawing segment minimum length must be finite and non-negative.");
  }
  if (Math.hypot(segment.end.x - segment.start.x, segment.end.y - segment.start.y) < minimumWorldLength) {
    return null;
  }
  return Object.freeze({
    id: segment.id,
    kind: segment.kind,
    start: segment.start,
    end: segment.end,
    style: segment.style,
  });
}

export function cancelDrawingActiveSegment(): null {
  return null;
}

export function createDrawingTextElement(input: Readonly<{
  id: string;
  anchor: DrawingPoint;
  content: string;
  fontSize?: number;
  style: DrawingElementStyle;
}>): DrawingTextElement | null {
  const content = input.content.trim();
  if (content.length === 0 || content.length > DRAWING_TEXT_MAX_LENGTH) return null;
  const fontSize = input.fontSize ?? DRAWING_TEXT_DEFAULT_FONT_SIZE;
  if (!Number.isFinite(fontSize) || fontSize <= 0) return null;
  return Object.freeze({
    id: input.id,
    kind: "text",
    anchor: freezePoint(input.anchor),
    content,
    fontSize,
    style: freezeStyle(input.style),
  });
}

export function measureDrawingPointGaps(points: readonly DrawingPoint[]): DrawingPointGapMetrics {
  if (points.length < 2) {
    return Object.freeze({ averageWorldGap: 0, maximumWorldGap: 0, segmentCount: 0 });
  }
  let total = 0;
  let maximum = 0;
  for (let index = 1; index < points.length; index += 1) {
    const gap = Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
    total += gap;
    maximum = Math.max(maximum, gap);
  }
  const segmentCount = points.length - 1;
  return Object.freeze({
    averageWorldGap: total / segmentCount,
    maximumWorldGap: maximum,
    segmentCount,
  });
}

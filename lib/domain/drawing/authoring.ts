import type {
  DrawingElementStyle,
  DrawingFreehandElement,
  DrawingPoint,
} from "./contracts";

export const DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE = 1.5;

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

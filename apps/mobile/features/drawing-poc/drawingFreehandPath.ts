import type { DrawingPoint, DrawingViewportTransform } from "@/domain/drawing";

export const DRAWING_FREEHAND_SMOOTHING_ALGORITHM = "midpoint-quadratic-v1" as const;

export type DrawingFreehandWorldPathCommand =
  | Readonly<{ kind: "line"; end: DrawingPoint }>
  | Readonly<{ kind: "quadratic"; control: DrawingPoint; end: DrawingPoint }>;

export type DrawingFreehandWorldPath = Readonly<{
  algorithm: typeof DRAWING_FREEHAND_SMOOTHING_ALGORITHM;
  start: DrawingPoint;
  commands: readonly DrawingFreehandWorldPathCommand[];
  rawPointCount: number;
  insertedPointCount: 0;
}>;

function freezePoint(point: DrawingPoint): DrawingPoint {
  return Object.freeze({ x: point.x, y: point.y });
}

function midpoint(left: DrawingPoint, right: DrawingPoint): DrawingPoint {
  return freezePoint({ x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 });
}

export function buildDrawingFreehandWorldPath(points: readonly DrawingPoint[]): DrawingFreehandWorldPath {
  if (points.length < 2) throw new RangeError("Freehand path requires at least two raw world points.");
  const start = freezePoint(points[0]);
  if (points.length === 2) {
    return Object.freeze({
      algorithm: DRAWING_FREEHAND_SMOOTHING_ALGORITHM,
      commands: Object.freeze([{ kind: "line" as const, end: freezePoint(points[1]) }]),
      insertedPointCount: 0 as const,
      rawPointCount: points.length,
      start,
    });
  }

  const commands: DrawingFreehandWorldPathCommand[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    commands.push(Object.freeze({
      kind: "quadratic" as const,
      control: freezePoint(points[index]),
      end: midpoint(points[index], points[index + 1]),
    }));
  }
  commands.push(Object.freeze({
    kind: "quadratic" as const,
    control: freezePoint(points[points.length - 1]),
    end: freezePoint(points[points.length - 1]),
  }));
  return Object.freeze({
    algorithm: DRAWING_FREEHAND_SMOOTHING_ALGORITHM,
    commands: Object.freeze(commands),
    insertedPointCount: 0 as const,
    rawPointCount: points.length,
    start,
  });
}

function screenPoint(point: DrawingPoint, transform: DrawingViewportTransform): DrawingPoint {
  return Object.freeze({
    x: point.x * transform.scale + transform.offsetX,
    y: point.y * transform.scale + transform.offsetY,
  });
}

function svgPoint(point: DrawingPoint): string {
  return `${point.x.toFixed(3)} ${point.y.toFixed(3)}`;
}

export function serializeDrawingFreehandSvgPath(
  path: DrawingFreehandWorldPath,
  transform: DrawingViewportTransform,
): string {
  const commands = [`M${svgPoint(screenPoint(path.start, transform))}`];
  for (const command of path.commands) {
    if (command.kind === "line") {
      commands.push(`L${svgPoint(screenPoint(command.end, transform))}`);
    } else {
      commands.push(`Q${svgPoint(screenPoint(command.control, transform))} ${svgPoint(screenPoint(command.end, transform))}`);
    }
  }
  return commands.join(" ");
}

export function buildDrawingFreehandSvgPath(
  points: readonly DrawingPoint[],
  transform: DrawingViewportTransform,
): string {
  return serializeDrawingFreehandSvgPath(buildDrawingFreehandWorldPath(points), transform);
}

import {
  buildDrawingFreehandWorldPath,
  DRAWING_FREEHAND_SMOOTHING_ALGORITHM,
  type DrawingFreehandWorldPath,
  type DrawingFreehandWorldPathCommand,
  type DrawingPoint,
  type DrawingViewportTransform,
} from "@/domain/drawing";

// Canonical renderer smoothing remains midpoint-quadratic-v1.

export {
  buildDrawingFreehandWorldPath,
  DRAWING_FREEHAND_SMOOTHING_ALGORITHM,
  type DrawingFreehandWorldPath,
  type DrawingFreehandWorldPathCommand,
};

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

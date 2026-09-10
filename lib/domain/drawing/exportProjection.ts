import type { DrawingElement, DrawingPoint, DrawingSceneV1, DrawingViewportTransform } from "./contracts";
import { buildDrawingFreehandWorldPath } from "./freehandPath";
import { resolveDrawingArrowHeadWorldGeometry } from "./hitTest";
import { createDrawingCamera, resolveDrawingViewportTransform } from "./viewport";

export type DrawingExportBox = Readonly<{ width: number; height: number }>;
type DrawingExportStyle = Readonly<{ strokeColor: string; strokeWidth: number; fillColor: string | null }>;
export type DrawingExportPrimitive =
  | Readonly<{ id: string; kind: "path"; d: string; style: DrawingExportStyle }>
  | Readonly<{ id: string; kind: "line"; x1: number; y1: number; x2: number; y2: number; style: DrawingExportStyle }>
  | Readonly<{ id: string; kind: "text"; x: number; y: number; content: string; fontSize: number; style: DrawingExportStyle }>
  | Readonly<{ id: string; kind: "rectangle" | "ellipse"; x: number; y: number; width: number; height: number; style: DrawingExportStyle }>;

export type DrawingExportProjection = Readonly<{
  outputBox: DrawingExportBox;
  transform: DrawingViewportTransform;
  primitives: readonly DrawingExportPrimitive[];
}>;

function point(value: DrawingPoint, transform: DrawingViewportTransform): DrawingPoint {
  return Object.freeze({
    x: value.x * transform.scale + transform.offsetX,
    y: value.y * transform.scale + transform.offsetY,
  });
}
function style(value: DrawingElement["style"], transform: DrawingViewportTransform): DrawingExportStyle {
  return Object.freeze({ ...value, strokeWidth: value.strokeWidth * transform.scale });
}

function svgPoint(value: DrawingPoint): string {
  return `${value.x.toFixed(3)} ${value.y.toFixed(3)}`;
}

function freehandPath(element: Extract<DrawingElement, { kind: "freehand" }>, transform: DrawingViewportTransform): string {
  const path = buildDrawingFreehandWorldPath(element.points);
  const commands = [`M${svgPoint(point(path.start, transform))}`];
  for (const command of path.commands) {
    commands.push(command.kind === "line"
      ? `L${svgPoint(point(command.end, transform))}`
      : `Q${svgPoint(point(command.control, transform))} ${svgPoint(point(command.end, transform))}`);
  }
  return commands.join(" ");
}

function linePath(points: readonly DrawingPoint[]): string {
  return points.map((value, index) => `${index === 0 ? "M" : "L"}${svgPoint(value)}`).join(" ");
}

export function projectDrawingElementForExport(
  element: DrawingElement,
  transform: DrawingViewportTransform,
): DrawingExportPrimitive {
  const projectedStyle = style(element.style, transform);
  if (element.kind === "freehand") {
    return Object.freeze({ id: element.id, kind: "path", d: freehandPath(element, transform), style: projectedStyle });
  }
  if (element.kind === "line") {
    const start = point(element.start, transform);
    const end = point(element.end, transform);
    return Object.freeze({ id: element.id, kind: "line", x1: start.x, y1: start.y, x2: end.x, y2: end.y, style: projectedStyle });
  }
  if (element.kind === "arrow") {
    const head = resolveDrawingArrowHeadWorldGeometry(element.start, element.end, element.style.strokeWidth);
    const start = point(element.start, transform);
    const end = point(element.end, transform);
    const left = point(head.left, transform);
    const right = point(head.right, transform);
    return Object.freeze({ id: element.id, kind: "path", d: `${linePath([start, end])} ${linePath([left, end, right])}`, style: projectedStyle });
  }
  if (element.kind === "text") {
    const anchor = point(element.anchor, transform);
    return Object.freeze({ id: element.id, kind: "text", x: anchor.x, y: anchor.y, content: element.content, fontSize: element.fontSize * transform.scale, style: projectedStyle });
  }
  const origin = point({ x: element.bounds.x, y: element.bounds.y }, transform);
  return Object.freeze({
    id: element.id,
    kind: element.kind,
    x: origin.x,
    y: origin.y,
    width: element.bounds.width * transform.scale,
    height: element.bounds.height * transform.scale,
    style: projectedStyle,
  });
}

export function projectDrawingSceneForExport(scene: DrawingSceneV1, outputBox: DrawingExportBox): DrawingExportProjection {
  const transform = resolveDrawingViewportTransform(createDrawingCamera(), outputBox);
  return Object.freeze({
    outputBox: Object.freeze({ width: outputBox.width, height: outputBox.height }),
    transform,
    primitives: Object.freeze(scene.elements.map((element) => projectDrawingElementForExport(element, transform))),
  });
}

import type {
  DrawingElement,
  DrawingRenderRequest,
  DrawingRendererAdapter,
  DrawingViewportTransform,
} from "@/domain/drawing";
import { resolveDrawingArrowHeadWorldGeometry, resolveDrawingElementWorldBounds } from "@/domain/drawing";
import { buildDrawingFreehandSvgPath } from "./drawingFreehandPath";
import { resolveDrawingEraserCursorScreenRadius } from "./drawingEraserVisualFeedback";

type PrimitiveStyle = Readonly<{ strokeColor: string; strokeWidth: number; fillColor: string | null }>;

export type DrawingRenderPrimitive =
  | Readonly<{ id: string; kind: "path"; d: string; opacity?: number; style: PrimitiveStyle }>
  | Readonly<{ id: string; kind: "line"; x1: number; y1: number; x2: number; y2: number; opacity?: number; style: PrimitiveStyle }>
  | Readonly<{ id: string; kind: "text"; x: number; y: number; content: string; fontSize: number; opacity?: number; style: PrimitiveStyle }>
  | Readonly<{ id: string; kind: "rectangle" | "ellipse"; x: number; y: number; width: number; height: number; opacity?: number; style: PrimitiveStyle }>;

export type DrawingProjectedFrame = readonly DrawingRenderPrimitive[];

function screenPoint(point: Readonly<{ x: number; y: number }>, transform: DrawingViewportTransform) {
  return Object.freeze({ x: point.x * transform.scale + transform.offsetX, y: point.y * transform.scale + transform.offsetY });
}

function styleFor(style: Readonly<{ strokeColor: string; strokeWidth: number; fillColor: string | null }>, transform: DrawingViewportTransform): PrimitiveStyle {
  return Object.freeze({ ...style, strokeWidth: style.strokeWidth * transform.scale });
}

function pathFromPoints(points: readonly Readonly<{ x: number; y: number }>[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(3)} ${point.y.toFixed(3)}`).join(" ");
}

function arrowPath(start: Readonly<{ x: number; y: number }>, end: Readonly<{ x: number; y: number }>, left: Readonly<{ x: number; y: number }>, right: Readonly<{ x: number; y: number }>) {
  return `${pathFromPoints([start, end])} ${pathFromPoints([left, end, right])}`;
}

export function projectDrawingElement(element: DrawingElement, transform: DrawingViewportTransform): DrawingRenderPrimitive {
  const style = styleFor(element.style, transform);
  if (element.kind === "freehand") {
    return Object.freeze({ id: element.id, kind: "path", d: buildDrawingFreehandSvgPath(element.points, transform), style });
  }
  if (element.kind === "line") {
    const start = screenPoint(element.start, transform);
    const end = screenPoint(element.end, transform);
    return Object.freeze({ id: element.id, kind: "line", x1: start.x, y1: start.y, x2: end.x, y2: end.y, style });
  }
  if (element.kind === "arrow") {
    const head = resolveDrawingArrowHeadWorldGeometry(element.start, element.end, element.style.strokeWidth);
    const start = screenPoint(element.start, transform);
    const end = screenPoint(element.end, transform);
    const left = screenPoint(head.left, transform);
    const right = screenPoint(head.right, transform);
    return Object.freeze({ id: element.id, kind: "path", d: arrowPath(start, end, left, right), style });
  }
  if (element.kind === "text") {
    const anchor = screenPoint(element.anchor, transform);
    return Object.freeze({ id: element.id, kind: "text", x: anchor.x, y: anchor.y, content: element.content, fontSize: element.fontSize * transform.scale, style });
  }
  const origin = screenPoint({ x: element.bounds.x, y: element.bounds.y }, transform);
  return Object.freeze({ id: element.id, kind: element.kind, x: origin.x, y: origin.y, width: element.bounds.width * transform.scale, height: element.bounds.height * transform.scale, style });
}

export function projectDrawingSelectionOutline(
  element: DrawingElement,
  transform: DrawingViewportTransform,
  strokeColor: string,
): DrawingRenderPrimitive {
  const bounds = resolveDrawingElementWorldBounds(element, 8);
  const origin = screenPoint({ x: bounds.x, y: bounds.y }, transform);
  return Object.freeze({
    id: `selection-outline:${element.id}`,
    kind: "rectangle",
    opacity: 0.78,
    style: Object.freeze({ fillColor: null, strokeColor, strokeWidth: Math.max(1.5, 2 * transform.scale) }),
    x: origin.x,
    y: origin.y,
    width: bounds.width * transform.scale,
    height: bounds.height * transform.scale,
  });
}

export function projectDrawingEraserCursor(
  point: Readonly<{ x: number; y: number }>,
  transform: DrawingViewportTransform,
  strokeColor: string,
  worldRadius: number,
): DrawingRenderPrimitive {
  const center = screenPoint(point, transform);
  const radius = resolveDrawingEraserCursorScreenRadius(
    worldRadius,
    transform.scale,
    0,
  );
  return Object.freeze({
    id: "eraser-cursor-ring",
    kind: "ellipse",
    opacity: 0.84,
    style: Object.freeze({ fillColor: null, strokeColor, strokeWidth: Math.max(1.25, 1.5 * transform.scale) }),
    x: center.x - radius,
    y: center.y - radius,
    width: radius * 2,
    height: radius * 2,
  });
}

export function projectDrawingScene(request: DrawingRenderRequest): DrawingProjectedFrame {
  const { scene, transform } = request;
  return Object.freeze(scene.elements.map((element) => projectDrawingElement(element, transform)));
}

export function projectDrawingTextInsertionPreview(input: Readonly<{
  anchor: Readonly<{ x: number; y: number }>;
  caretStyle: PrimitiveStyle;
  content: string;
  fontSize: number;
  textStyle: PrimitiveStyle;
}>, transform: DrawingViewportTransform): DrawingProjectedFrame {
  const verticalStart = screenPoint({ x: input.anchor.x, y: input.anchor.y - input.fontSize * 0.9 }, transform);
  const verticalEnd = screenPoint({ x: input.anchor.x, y: input.anchor.y + input.fontSize * 0.12 }, transform);
  const anchor = screenPoint(input.anchor, transform);
  const preview: DrawingRenderPrimitive[] = [Object.freeze({
    id: "pending-text-insertion-caret",
    kind: "line",
    opacity: 0.72,
    style: styleFor(input.caretStyle, transform),
    x1: verticalStart.x,
    x2: verticalEnd.x,
    y1: verticalStart.y,
    y2: verticalEnd.y,
  })];
  if (input.content.length > 0) preview.push(Object.freeze({
    content: input.content,
    fontSize: input.fontSize * transform.scale,
    id: "pending-text-ghost-preview",
    kind: "text",
    opacity: 0.55,
    style: styleFor(input.textStyle, transform),
    x: anchor.x,
    y: anchor.y,
  }));
  return Object.freeze(preview);
}

export const drawingRenderProjectionAdapter: DrawingRendererAdapter<DrawingProjectedFrame> = Object.freeze({
  render: projectDrawingScene,
});

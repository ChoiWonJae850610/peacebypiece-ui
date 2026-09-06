import type {
  DrawingElement,
  DrawingRenderRequest,
  DrawingRendererAdapter,
  DrawingViewportTransform,
} from "@/domain/drawing";
import { buildDrawingFreehandSvgPath } from "./drawingFreehandPath";

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

function arrowPath(start: Readonly<{ x: number; y: number }>, end: Readonly<{ x: number; y: number }>, strokeWidth: number) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const head = Math.max(12, strokeWidth * 4);
  const left = { x: end.x - head * Math.cos(angle - Math.PI / 6), y: end.y - head * Math.sin(angle - Math.PI / 6) };
  const right = { x: end.x - head * Math.cos(angle + Math.PI / 6), y: end.y - head * Math.sin(angle + Math.PI / 6) };
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
    const start = screenPoint(element.start, transform);
    const end = screenPoint(element.end, transform);
    return Object.freeze({ id: element.id, kind: "path", d: arrowPath(start, end, style.strokeWidth), style });
  }
  if (element.kind === "text") {
    const anchor = screenPoint(element.anchor, transform);
    return Object.freeze({ id: element.id, kind: "text", x: anchor.x, y: anchor.y, content: element.content, fontSize: element.fontSize * transform.scale, style });
  }
  const origin = screenPoint({ x: element.bounds.x, y: element.bounds.y }, transform);
  return Object.freeze({ id: element.id, kind: element.kind, x: origin.x, y: origin.y, width: element.bounds.width * transform.scale, height: element.bounds.height * transform.scale, style });
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

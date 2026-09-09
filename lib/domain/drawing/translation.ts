import {
  DRAWING_CANONICAL_CANVAS,
  type DrawingElement,
  type DrawingPoint,
  type DrawingSceneV1,
} from "./contracts";
import { createDrawingScene } from "./scene";

export type DrawingElementTranslation = Readonly<{
  changed: boolean;
  delta: DrawingPoint;
  element: DrawingElement;
}>;

function requireFinitePoint(point: DrawingPoint, name: string): DrawingPoint {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${name} must contain finite coordinates.`);
  }
  return point;
}

function persistedCoordinateExtent(element: DrawingElement): Readonly<{
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}> {
  if (element.kind === "freehand") {
    const xs = element.points.map((point) => point.x);
    const ys = element.points.map((point) => point.y);
    return Object.freeze({
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
      minX: Math.min(...xs),
      minY: Math.min(...ys),
    });
  }
  if (element.kind === "line" || element.kind === "arrow") {
    return Object.freeze({
      maxX: Math.max(element.start.x, element.end.x),
      maxY: Math.max(element.start.y, element.end.y),
      minX: Math.min(element.start.x, element.end.x),
      minY: Math.min(element.start.y, element.end.y),
    });
  }
  if (element.kind === "text") {
    return Object.freeze({
      maxX: element.anchor.x,
      maxY: element.anchor.y,
      minX: element.anchor.x,
      minY: element.anchor.y,
    });
  }
  return Object.freeze({
    maxX: element.bounds.x + element.bounds.width,
    maxY: element.bounds.y + element.bounds.height,
    minX: element.bounds.x,
    minY: element.bounds.y,
  });
}

export function resolveDrawingElementTranslation(
  element: DrawingElement,
  requestedDelta: DrawingPoint,
): DrawingElementTranslation {
  requireFinitePoint(requestedDelta, "requestedDelta");
  const extent = persistedCoordinateExtent(element);
  const delta = Object.freeze({
    x: Math.max(-extent.minX, Math.min(DRAWING_CANONICAL_CANVAS.width - extent.maxX, requestedDelta.x)),
    y: Math.max(-extent.minY, Math.min(DRAWING_CANONICAL_CANVAS.height - extent.maxY, requestedDelta.y)),
  });
  if (delta.x === 0 && delta.y === 0) {
    return Object.freeze({ changed: false, delta, element });
  }

  const translatePoint = (point: DrawingPoint): DrawingPoint => Object.freeze({
    x: point.x + delta.x,
    y: point.y + delta.y,
  });
  let translated: DrawingElement;
  if (element.kind === "freehand") {
    translated = Object.freeze({
      ...element,
      points: Object.freeze(element.points.map(translatePoint)),
    });
  } else if (element.kind === "line" || element.kind === "arrow") {
    translated = Object.freeze({
      ...element,
      end: translatePoint(element.end),
      start: translatePoint(element.start),
    });
  } else if (element.kind === "text") {
    translated = Object.freeze({ ...element, anchor: translatePoint(element.anchor) });
  } else {
    translated = Object.freeze({
      ...element,
      bounds: Object.freeze({
        ...element.bounds,
        x: element.bounds.x + delta.x,
        y: element.bounds.y + delta.y,
      }),
    });
  }
  return Object.freeze({ changed: true, delta, element: translated });
}

export function replaceDrawingSceneElement(
  scene: DrawingSceneV1,
  elementId: string,
  replacement: DrawingElement,
): DrawingSceneV1 {
  const index = scene.elements.findIndex((element) => element.id === elementId);
  if (index < 0) return scene;
  if (replacement.id !== elementId) {
    throw new RangeError("Drawing replacement must preserve the selected element ID.");
  }
  if (scene.elements[index] === replacement) return scene;
  const elements = [...scene.elements];
  elements[index] = replacement;
  return createDrawingScene(elements);
}

export function resolveDrawingSelectionMoveDelta(input: Readonly<{
  currentScreen: DrawingPoint;
  currentWorld: DrawingPoint;
  minimumScreenDistance: number;
  startScreen: DrawingPoint;
  startWorld: DrawingPoint;
}>): DrawingPoint | null {
  requireFinitePoint(input.currentScreen, "currentScreen");
  requireFinitePoint(input.currentWorld, "currentWorld");
  requireFinitePoint(input.startScreen, "startScreen");
  requireFinitePoint(input.startWorld, "startWorld");
  if (!Number.isFinite(input.minimumScreenDistance) || input.minimumScreenDistance < 0) {
    throw new RangeError("minimumScreenDistance must be finite and non-negative.");
  }
  if (Math.hypot(
    input.currentScreen.x - input.startScreen.x,
    input.currentScreen.y - input.startScreen.y,
  ) < input.minimumScreenDistance) return null;
  const delta = Object.freeze({
    x: input.currentWorld.x - input.startWorld.x,
    y: input.currentWorld.y - input.startWorld.y,
  });
  return delta.x === 0 && delta.y === 0 ? null : delta;
}

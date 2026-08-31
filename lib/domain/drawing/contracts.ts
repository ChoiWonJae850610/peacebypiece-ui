export const DRAWING_SCENE_SCHEMA_VERSION = 1 as const;

export const DRAWING_CANONICAL_CANVAS = Object.freeze({
  width: 1_000,
  height: 1_400,
  origin: "top-left" as const,
  xAxis: "right" as const,
  yAxis: "down" as const,
});

export type DrawingCanonicalCanvas = typeof DRAWING_CANONICAL_CANVAS;

export type DrawingPoint = Readonly<{
  x: number;
  y: number;
}>;

export type DrawingElementStyle = Readonly<{
  strokeColor: string;
  strokeWidth: number;
  fillColor: string | null;
}>;

type DrawingElementBase = Readonly<{
  id: string;
  style: DrawingElementStyle;
}>;

export type DrawingFreehandElement = DrawingElementBase &
  Readonly<{
    kind: "freehand";
    points: readonly DrawingPoint[];
  }>;

export type DrawingLineElement = DrawingElementBase &
  Readonly<{
    kind: "line";
    start: DrawingPoint;
    end: DrawingPoint;
  }>;

export type DrawingArrowElement = DrawingElementBase &
  Readonly<{
    kind: "arrow";
    start: DrawingPoint;
    end: DrawingPoint;
  }>;

export type DrawingBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type DrawingRectangleElement = DrawingElementBase &
  Readonly<{
    kind: "rectangle";
    bounds: DrawingBounds;
  }>;

export type DrawingEllipseElement = DrawingElementBase &
  Readonly<{
    kind: "ellipse";
    bounds: DrawingBounds;
  }>;

export type DrawingElement =
  | DrawingFreehandElement
  | DrawingLineElement
  | DrawingArrowElement
  | DrawingRectangleElement
  | DrawingEllipseElement;

export type DrawingSceneV1 = Readonly<{
  schemaVersion: typeof DRAWING_SCENE_SCHEMA_VERSION;
  canvas: DrawingCanonicalCanvas;
  elements: readonly DrawingElement[];
}>;

export type DrawingCamera = Readonly<{
  centerX: number;
  centerY: number;
  zoom: number;
}>;

export type DrawingViewport = Readonly<{
  width: number;
  height: number;
}>;

export type DrawingViewportTransform = Readonly<{
  fitScale: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}>;

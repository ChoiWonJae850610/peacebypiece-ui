import { DRAWING_CANONICAL_CANVAS, type DrawingViewport } from "./contracts";

export type DrawingCanvasSurfaceLayout = Readonly<{
  height: number;
  left: number;
  scale: number;
  top: number;
  width: number;
}>;

function requirePositiveFinite(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be positive and finite.`);
  }
  return value;
}

export function resolveDrawingCanvasSurfaceLayout(
  stageViewport: DrawingViewport,
): DrawingCanvasSurfaceLayout {
  const stageWidth = requirePositiveFinite(stageViewport.width, "stageViewport.width");
  const stageHeight = requirePositiveFinite(stageViewport.height, "stageViewport.height");
  const scale = Math.min(
    stageWidth / DRAWING_CANONICAL_CANVAS.width,
    stageHeight / DRAWING_CANONICAL_CANVAS.height,
  );
  const width = DRAWING_CANONICAL_CANVAS.width * scale;
  const height = DRAWING_CANONICAL_CANVAS.height * scale;
  return Object.freeze({
    height,
    left: (stageWidth - width) / 2,
    scale,
    top: (stageHeight - height) / 2,
    width,
  });
}

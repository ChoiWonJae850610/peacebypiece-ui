export function resolveDrawingZoomPercent(zoom: number): number {
  if (!Number.isFinite(zoom) || zoom <= 0) {
    throw new RangeError("Drawing camera zoom must be a finite positive number.");
  }
  return Math.round(zoom * 100);
}

export function formatDrawingZoomPercentLabel(zoom: number): string {
  return `${resolveDrawingZoomPercent(zoom)}%`;
}

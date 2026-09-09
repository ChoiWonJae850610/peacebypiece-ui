import {
  DRAWING_CANONICAL_CANVAS,
  type DrawingCamera,
  type DrawingPoint,
  type DrawingViewport,
} from "./contracts";
import {
  createDrawingCamera,
  resolveDrawingViewportTransform,
  screenToWorld,
} from "./viewport";

export const DRAWING_CAMERA_MIN_ZOOM = 1;
export const DRAWING_CAMERA_MAX_ZOOM = 4;
export const DRAWING_CAMERA_GESTURE_MIN_DISTANCE = 0.001;

export type DrawingCameraTouch = Readonly<{
  identifier?: number | string;
  localX: number;
  localY: number;
  pageX: number;
  pageY: number;
}>;

export type DrawingCameraGesture = Readonly<{
  anchorWorld: DrawingPoint;
  baseCamera: DrawingCamera;
  baseLocalCentroid: DrawingPoint;
  basePageCentroid: DrawingPoint;
  basePageDistance: number;
  touchIdentifiers: readonly [number | string, number | string] | null;
  viewportGeneration: number;
}>;

export type DrawingCameraZoomClampState = "min" | "none" | "max";

export type DrawingCameraZoomSample = Readonly<{
  rawZoom: number;
  clampedZoom: number;
  clampState: DrawingCameraZoomClampState;
}>;

export type DrawingCameraGestureUpdate = Readonly<{
  camera: DrawingCamera;
  gesture: DrawingCameraGesture;
  zoomSample: DrawingCameraZoomSample;
  rebasedAtBoundary: Exclude<DrawingCameraZoomClampState, "none"> | null;
}>;

function requireFinitePoint(point: DrawingPoint, name: string): DrawingPoint {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new RangeError(`${name} must contain finite coordinates.`);
  }
  return point;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function resolveDrawingCameraZoomSample(input: Readonly<{
  baseZoom: number;
  basePageDistance: number;
  currentPageDistance: number;
}>): DrawingCameraZoomSample {
  if (
    !Number.isFinite(input.baseZoom)
    || !Number.isFinite(input.basePageDistance)
    || !Number.isFinite(input.currentPageDistance)
    || input.basePageDistance < DRAWING_CAMERA_GESTURE_MIN_DISTANCE
    || input.currentPageDistance < 0
  ) {
    throw new RangeError("Drawing camera zoom sample requires finite non-negative distances and a valid base distance.");
  }
  const rawZoom = input.baseZoom * input.currentPageDistance / input.basePageDistance;
  return Object.freeze({
    rawZoom,
    clampedZoom: clamp(rawZoom, DRAWING_CAMERA_MIN_ZOOM, DRAWING_CAMERA_MAX_ZOOM),
    clampState: rawZoom < DRAWING_CAMERA_MIN_ZOOM
      ? "min"
      : rawZoom > DRAWING_CAMERA_MAX_ZOOM
        ? "max"
        : "none",
  });
}

function isPushingFartherIntoZoomBoundary(input: Readonly<{
  basePageDistance: number;
  currentPageDistance: number;
  clampState: DrawingCameraZoomClampState;
}>): input is Readonly<{
  basePageDistance: number;
  currentPageDistance: number;
  clampState: Exclude<DrawingCameraZoomClampState, "none">;
}> {
  const directionEpsilon = Number.EPSILON * Math.max(
    1,
    Math.abs(input.basePageDistance),
    Math.abs(input.currentPageDistance),
  ) * 8;
  if (input.clampState === "min") {
    return input.currentPageDistance >= DRAWING_CAMERA_GESTURE_MIN_DISTANCE
      && input.currentPageDistance < input.basePageDistance - directionEpsilon;
  }
  return input.clampState === "max"
    && input.currentPageDistance > input.basePageDistance + directionEpsilon;
}

export function resolveDrawingTwoTouchCentroid(
  touches: readonly DrawingCameraTouch[],
): DrawingPoint | null {
  if (touches.length < 2) return null;
  const first = requireFinitePoint({ x: touches[0].localX, y: touches[0].localY }, "touches[0].local");
  const second = requireFinitePoint({ x: touches[1].localX, y: touches[1].localY }, "touches[1].local");
  return Object.freeze({
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  });
}

export function resolveDrawingTwoTouchDistance(
  touches: readonly DrawingCameraTouch[],
): number | null {
  if (touches.length < 2) return null;
  const first = requireFinitePoint({ x: touches[0].pageX, y: touches[0].pageY }, "touches[0].page");
  const second = requireFinitePoint({ x: touches[1].pageX, y: touches[1].pageY }, "touches[1].page");
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function resolveDrawingTwoTouchPageCentroid(
  touches: readonly DrawingCameraTouch[],
): DrawingPoint | null {
  if (touches.length < 2) return null;
  const first = requireFinitePoint({ x: touches[0].pageX, y: touches[0].pageY }, "touches[0].page");
  const second = requireFinitePoint({ x: touches[1].pageX, y: touches[1].pageY }, "touches[1].page");
  return Object.freeze({
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  });
}

function resolveGestureTouchPair(
  touches: readonly DrawingCameraTouch[],
  identifiers: readonly [number | string, number | string] | null,
): readonly [DrawingCameraTouch, DrawingCameraTouch] | null {
  if (touches.length < 2) return null;
  if (identifiers === null) return Object.freeze([touches[0], touches[1]]);
  const first = touches.find((touch) => touch.identifier === identifiers[0]);
  const second = touches.find((touch) => touch.identifier === identifiers[1]);
  return first && second ? Object.freeze([first, second]) : null;
}

function resolveTouchIdentifiers(
  touches: readonly DrawingCameraTouch[],
): readonly [number | string, number | string] | null {
  const first = touches[0]?.identifier;
  const second = touches[1]?.identifier;
  const valid = (value: number | string | undefined) => (
    typeof value === "string" ? value.length > 0 : Number.isFinite(value)
  );
  return valid(first) && valid(second) && first !== second
    ? Object.freeze([first as number | string, second as number | string])
    : null;
}

export function createDrawingCoverCamera(viewport: DrawingViewport): DrawingCamera {
  if (
    !Number.isFinite(viewport.width)
    || !Number.isFinite(viewport.height)
    || viewport.width <= 0
    || viewport.height <= 0
  ) return createDrawingCamera();
  const fitScale = Math.min(
    viewport.width / DRAWING_CANONICAL_CANVAS.width,
    viewport.height / DRAWING_CANONICAL_CANVAS.height,
  );
  const coverScale = Math.max(
    viewport.width / DRAWING_CANONICAL_CANVAS.width,
    viewport.height / DRAWING_CANONICAL_CANVAS.height,
  );
  return createDrawingCamera({
    centerX: DRAWING_CANONICAL_CANVAS.width / 2,
    centerY: DRAWING_CANONICAL_CANVAS.height / 2,
    zoom: clamp(coverScale / fitScale, DRAWING_CAMERA_MIN_ZOOM, DRAWING_CAMERA_MAX_ZOOM),
  });
}

export function clampDrawingCamera(
  camera: DrawingCamera,
  viewport: DrawingViewport,
): DrawingCamera {
  const zoom = clamp(camera.zoom, DRAWING_CAMERA_MIN_ZOOM, DRAWING_CAMERA_MAX_ZOOM);
  const candidate = createDrawingCamera({ ...camera, zoom });
  const { fitScale } = resolveDrawingViewportTransform(candidate, viewport);
  const scale = fitScale * zoom;
  const visibleWorldWidth = viewport.width / scale;
  const visibleWorldHeight = viewport.height / scale;
  const clampAxis = (center: number, visibleSpan: number, paperSpan: number) => (
    visibleSpan >= paperSpan
      ? paperSpan / 2
      : clamp(center, visibleSpan / 2, paperSpan - visibleSpan / 2)
  );
  return createDrawingCamera({
    centerX: clampAxis(candidate.centerX, visibleWorldWidth, DRAWING_CANONICAL_CANVAS.width),
    centerY: clampAxis(candidate.centerY, visibleWorldHeight, DRAWING_CANONICAL_CANVAS.height),
    zoom,
  });
}

export function beginDrawingCameraGesture(input: Readonly<{
  camera: DrawingCamera;
  touches: readonly DrawingCameraTouch[];
  viewport: DrawingViewport;
  viewportGeneration: number;
}>): DrawingCameraGesture | null {
  if (!Number.isInteger(input.viewportGeneration) || input.viewportGeneration < 0) {
    throw new RangeError("Drawing camera viewport generation must be a non-negative integer.");
  }
  const baseLocalCentroid = resolveDrawingTwoTouchCentroid(input.touches);
  const basePageCentroid = resolveDrawingTwoTouchPageCentroid(input.touches);
  const basePageDistance = resolveDrawingTwoTouchDistance(input.touches);
  if (
    baseLocalCentroid === null
    || basePageCentroid === null
    || basePageDistance === null
    || basePageDistance < DRAWING_CAMERA_GESTURE_MIN_DISTANCE
  ) return null;
  const baseCamera = clampDrawingCamera(input.camera, input.viewport);
  return Object.freeze({
    anchorWorld: screenToWorld(baseLocalCentroid, baseCamera, input.viewport),
    baseCamera,
    baseLocalCentroid,
    basePageCentroid,
    basePageDistance,
    touchIdentifiers: resolveTouchIdentifiers(input.touches),
    viewportGeneration: input.viewportGeneration,
  });
}

export function resolveDrawingCameraGestureUpdate(input: Readonly<{
  gesture: DrawingCameraGesture;
  touches: readonly DrawingCameraTouch[];
  viewport: DrawingViewport;
  viewportGeneration: number;
}>): DrawingCameraGestureUpdate | null {
  if (input.viewportGeneration !== input.gesture.viewportGeneration) return null;
  const pair = resolveGestureTouchPair(input.touches, input.gesture.touchIdentifiers);
  if (pair === null) return null;
  const currentPageCentroid = resolveDrawingTwoTouchPageCentroid(pair);
  const currentPageDistance = resolveDrawingTwoTouchDistance(pair);
  if (currentPageCentroid === null || currentPageDistance === null) return null;
  const currentLocalCentroid = Object.freeze({
    x: input.gesture.baseLocalCentroid.x + currentPageCentroid.x - input.gesture.basePageCentroid.x,
    y: input.gesture.baseLocalCentroid.y + currentPageCentroid.y - input.gesture.basePageCentroid.y,
  });
  const zoomSample = resolveDrawingCameraZoomSample({
    baseZoom: input.gesture.baseCamera.zoom,
    basePageDistance: input.gesture.basePageDistance,
    currentPageDistance,
  });
  const nextZoom = zoomSample.clampedZoom;
  const { fitScale } = resolveDrawingViewportTransform(
    createDrawingCamera({ ...input.gesture.baseCamera, zoom: nextZoom }),
    input.viewport,
  );
  const scale = fitScale * nextZoom;
  const camera = clampDrawingCamera(createDrawingCamera({
    centerX: input.gesture.anchorWorld.x - (currentLocalCentroid.x - input.viewport.width / 2) / scale,
    centerY: input.gesture.anchorWorld.y - (currentLocalCentroid.y - input.viewport.height / 2) / scale,
    zoom: nextZoom,
  }), input.viewport);
  if (!isPushingFartherIntoZoomBoundary({
    basePageDistance: input.gesture.basePageDistance,
    currentPageDistance,
    clampState: zoomSample.clampState,
  })) {
    return Object.freeze({ camera, gesture: input.gesture, zoomSample, rebasedAtBoundary: null });
  }
  const gesture = Object.freeze({
    anchorWorld: screenToWorld(currentLocalCentroid, camera, input.viewport),
    baseCamera: camera,
    baseLocalCentroid: currentLocalCentroid,
    basePageCentroid: currentPageCentroid,
    basePageDistance: currentPageDistance,
    touchIdentifiers: input.gesture.touchIdentifiers,
    viewportGeneration: input.gesture.viewportGeneration,
  });
  const rebasedAtBoundary: Exclude<DrawingCameraZoomClampState, "none"> = zoomSample.clampState === "min"
    ? "min"
    : "max";
  return Object.freeze({
    camera,
    gesture,
    zoomSample,
    rebasedAtBoundary,
  });
}

export function resolveDrawingCameraGesture(input: Readonly<{
  gesture: DrawingCameraGesture;
  touches: readonly DrawingCameraTouch[];
  viewport: DrawingViewport;
  viewportGeneration: number;
}>): DrawingCamera | null {
  return resolveDrawingCameraGestureUpdate(input)?.camera ?? null;
}

export type DrawingDeviceVariant = "desktop" | "tablet" | "mobile";

export type DrawingCanvasSize = {
  width: number;
  height: number;
};

export type DrawingDevicePolicy = {
  variant: DrawingDeviceVariant;
  canvasSize: DrawingCanvasSize;
  blockLandscape: boolean;
  initialStrokeSize: number;
};

const DESKTOP_CANVAS_SIZE: DrawingCanvasSize = { width: 1280, height: 900 };
const PORTRAIT_CANVAS_SIZE: DrawingCanvasSize = { width: 900, height: 1280 };
const TABLET_SHORT_EDGE_MIN = 700;

export const DRAWING_DEVICE_POLICIES: Record<DrawingDeviceVariant, DrawingDevicePolicy> = {
  desktop: {
    variant: "desktop",
    canvasSize: DESKTOP_CANVAS_SIZE,
    blockLandscape: false,
    initialStrokeSize: 3,
  },
  tablet: {
    variant: "tablet",
    canvasSize: PORTRAIT_CANVAS_SIZE,
    blockLandscape: true,
    initialStrokeSize: 3,
  },
  mobile: {
    variant: "mobile",
    canvasSize: PORTRAIT_CANVAS_SIZE,
    blockLandscape: true,
    initialStrokeSize: 6,
  },
};

export function resolveDrawingDevicePolicy(variant: DrawingDeviceVariant = "desktop") {
  return DRAWING_DEVICE_POLICIES[variant] ?? DRAWING_DEVICE_POLICIES.desktop;
}

function matchesMediaQuery(query: string) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(query).matches;
}

function getViewportShortEdge() {
  if (typeof window === "undefined") return 0;
  return Math.min(window.innerWidth || 0, window.innerHeight || 0);
}

function hasFineHoverPointer() {
  return matchesMediaQuery("(hover: hover) and (pointer: fine)");
}

function hasCoarsePrimaryPointer() {
  return matchesMediaQuery("(pointer: coarse)");
}

function hasTouchOnlyRuntime() {
  if (hasFineHoverPointer()) return false;
  if (hasCoarsePrimaryPointer()) return true;
  if (typeof navigator === "undefined") return false;
  return (navigator.maxTouchPoints ?? 0) > 0;
}

export function resolveRuntimeDrawingDeviceVariant(fallbackVariant: DrawingDeviceVariant = "desktop"): DrawingDeviceVariant {
  if (typeof window === "undefined") return fallbackVariant;
  if (!hasTouchOnlyRuntime()) return "desktop";
  return getViewportShortEdge() >= TABLET_SHORT_EDGE_MIN ? "tablet" : "mobile";
}

export function shouldBlockDrawingForLandscape(policy: DrawingDevicePolicy) {
  if (typeof window === "undefined" || !policy.blockLandscape) return false;
  return window.innerWidth > window.innerHeight;
}

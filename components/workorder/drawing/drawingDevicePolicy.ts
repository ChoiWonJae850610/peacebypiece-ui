export type DrawingDeviceVariant = "desktop" | "tablet" | "mobile";
export type DrawingRuntimeEditorVariant = DrawingDeviceVariant | "ipad";

export type DrawingCanvasSize = {
  width: number;
  height: number;
};

export type DrawingDevicePolicy = {
  variant: DrawingRuntimeEditorVariant;
  canvasSize: DrawingCanvasSize;
  blockLandscape: boolean;
  initialStrokeSize: number;
};

const DESKTOP_CANVAS_SIZE: DrawingCanvasSize = { width: 1280, height: 900 };
const PORTRAIT_CANVAS_SIZE: DrawingCanvasSize = { width: 900, height: 1280 };
const TABLET_SHORT_EDGE_MIN = 700;
const TABLET_SCREEN_SHORT_EDGE_MIN = 600;
const TABLET_SCREEN_LONG_EDGE_MIN = 900;

export const DRAWING_DEVICE_POLICIES: Record<DrawingRuntimeEditorVariant, DrawingDevicePolicy> = {
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
  ipad: {
    variant: "ipad",
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

export function resolveDrawingDevicePolicy(variant: DrawingRuntimeEditorVariant = "desktop") {
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

function getScreenEdges() {
  if (typeof window === "undefined" || !window.screen) return { shortEdge: 0, longEdge: 0 };
  const width = window.screen.width || 0;
  const height = window.screen.height || 0;
  return {
    shortEdge: Math.min(width, height),
    longEdge: Math.max(width, height),
  };
}

function hasFineHoverPointer() {
  return matchesMediaQuery("(hover: hover) and (pointer: fine)");
}

function hasCoarsePrimaryPointer() {
  return matchesMediaQuery("(pointer: coarse)");
}

function hasTouchCapableRuntime() {
  if (typeof navigator === "undefined") return false;
  return (navigator.maxTouchPoints ?? 0) > 0;
}

function hasTouchOnlyRuntime() {
  if (hasFineHoverPointer()) return false;
  if (hasCoarsePrimaryPointer()) return true;
  return hasTouchCapableRuntime();
}

export function isIpadDrawingRuntime() {
  if (typeof navigator === "undefined") return false;
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const maxTouchPoints = navigator.maxTouchPoints ?? 0;

  if (/iPad/i.test(userAgent)) return true;
  return /Mac/i.test(platform) && maxTouchPoints > 1;
}

function isTabletSizedRuntime() {
  const screenEdges = getScreenEdges();
  if (
    screenEdges.shortEdge >= TABLET_SCREEN_SHORT_EDGE_MIN &&
    screenEdges.longEdge >= TABLET_SCREEN_LONG_EDGE_MIN
  ) {
    return true;
  }
  return getViewportShortEdge() >= TABLET_SHORT_EDGE_MIN;
}

export function resolveRuntimeDrawingEditorVariant(fallbackVariant: DrawingDeviceVariant = "desktop"): DrawingRuntimeEditorVariant {
  if (typeof window === "undefined") return fallbackVariant;
  if (isIpadDrawingRuntime()) return "ipad";
  if (!hasTouchOnlyRuntime()) return "desktop";
  return isTabletSizedRuntime() ? "tablet" : "mobile";
}

export function resolveRuntimeDrawingDeviceVariant(fallbackVariant: DrawingDeviceVariant = "desktop"): DrawingDeviceVariant {
  const resolved = resolveRuntimeDrawingEditorVariant(fallbackVariant);
  return resolved === "ipad" ? "tablet" : resolved;
}

function getDocumentOrientationSize() {
  if (typeof document === "undefined") return { width: 0, height: 0 };
  return {
    width: document.documentElement.clientWidth || 0,
    height: document.documentElement.clientHeight || 0,
  };
}

function getVisualViewportOrientationSize() {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return {
    width: window.visualViewport?.width || 0,
    height: window.visualViewport?.height || 0,
  };
}

function shouldBlockIpadDrawingForLandscape() {
  if (matchesMediaQuery("(orientation: portrait)")) return false;
  if (matchesMediaQuery("(orientation: landscape)")) return true;

  if (typeof window !== "undefined") {
    const orientationType = window.screen?.orientation?.type || "";
    if (orientationType.includes("portrait")) return false;
    if (orientationType.includes("landscape")) return true;

    const visualViewportSize = getVisualViewportOrientationSize();
    if (visualViewportSize.width > 0 && visualViewportSize.height > 0) {
      return visualViewportSize.width > visualViewportSize.height;
    }

    const documentSize = getDocumentOrientationSize();
    if (documentSize.width > 0 && documentSize.height > 0) {
      return documentSize.width > documentSize.height;
    }

    return window.innerWidth > window.innerHeight;
  }

  return false;
}

export function shouldBlockDrawingForLandscape(policy: DrawingDevicePolicy) {
  if (typeof window === "undefined" || !policy.blockLandscape) return false;
  if (policy.variant === "ipad") return shouldBlockIpadDrawingForLandscape();
  return window.innerWidth > window.innerHeight;
}

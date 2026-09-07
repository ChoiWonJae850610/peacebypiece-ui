import nativeOrientationPolicy from "../config/waflNativeOrientationPolicy.js";

export const WAFL_ANDROID_TABLET_SHORT_SIDE_DP = nativeOrientationPolicy.androidTabletSmallestWidthDp;
export const WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP = nativeOrientationPolicy.iosRegularTabletShortSidePoints;

export type WaflMobilePlatform = "ios" | "android" | "web" | "other";
export type WaflMobileDeviceClass = "handset" | "compact-tablet" | "regular-tablet" | "other";
export type WaflRootStackOrientation = "portrait_up" | "default";
export type WaflRuntimeOrientationAction = "lock-portrait-up" | "unlock-default" | "none";
export type WaflRuntimeOrientationScope = "base" | "product-sketch";

export type WaflMobileDeviceClassInput = {
  readonly platform: WaflMobilePlatform;
  readonly isPad: boolean;
  readonly screenWidth: number;
  readonly screenHeight: number;
};

function resolveStableShortSide(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  return Math.min(width, height);
}

/**
 * iOS first uses the native tablet idiom and Android uses the native-policy
 * 600dp boundary. Both platforms then classify tablet product behavior from
 * the physical screen's short side. The short side is invariant when width and
 * height swap, and 768 reuses the canonical responsive tablet breakpoint.
 */
export function resolveWaflMobileDeviceClass(input: WaflMobileDeviceClassInput): WaflMobileDeviceClass {
  const shortSide = resolveStableShortSide(input.screenWidth, input.screenHeight);
  if (input.platform === "ios") {
    if (!input.isPad) return "handset";
    return shortSide !== null && shortSide >= WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP
      ? "regular-tablet"
      : "compact-tablet";
  }
  if (input.platform === "android") {
    if (shortSide === null || shortSide < WAFL_ANDROID_TABLET_SHORT_SIDE_DP) return "handset";
    return shortSide >= WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP ? "regular-tablet" : "compact-tablet";
  }
  return "other";
}

export function resolveWaflRootStackOrientation(input: WaflMobileDeviceClassInput): WaflRootStackOrientation {
  const deviceClass = resolveWaflMobileDeviceClass(input);
  return deviceClass === "handset" || deviceClass === "compact-tablet" ? "portrait_up" : "default";
}

export function resolveWaflRuntimeOrientationAction(
  deviceClass: WaflMobileDeviceClass,
  scope: WaflRuntimeOrientationScope = "base",
): WaflRuntimeOrientationAction {
  if (scope === "product-sketch" && deviceClass !== "other") {
    return "lock-portrait-up";
  }
  if (deviceClass === "handset" || deviceClass === "compact-tablet") {
    return "lock-portrait-up";
  }
  if (deviceClass === "regular-tablet") {
    return "unlock-default";
  }
  return "none";
}

export function shouldReconcileWaflRuntimeOrientation(
  previousAppState: string,
  nextAppState: string,
) {
  return previousAppState !== "active" && nextAppState === "active";
}

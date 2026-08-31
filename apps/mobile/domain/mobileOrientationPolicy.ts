import nativeOrientationPolicy from "../config/waflNativeOrientationPolicy.js";

export const WAFL_ANDROID_TABLET_SHORT_SIDE_DP = nativeOrientationPolicy.androidTabletSmallestWidthDp;

export type WaflMobilePlatform = "ios" | "android" | "web" | "other";
export type WaflMobileDeviceClass = "handset" | "tablet" | "other";
export type WaflRootStackOrientation = "portrait_up" | "default";
export type WaflRuntimeOrientationAction = "lock-portrait-up" | "unlock-default" | "none";

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
 * iOS exposes a stable native interface idiom through Platform.isPad. Android
 * has no tablet idiom in the installed React Native surface, so its physical
 * screen short side is the bounded fallback. The short side is invariant when
 * width and height swap during rotation and follows Android's large-screen
 * 600dp boundary.
 */
export function resolveWaflMobileDeviceClass(input: WaflMobileDeviceClassInput): WaflMobileDeviceClass {
  if (input.platform === "ios") {
    return input.isPad ? "tablet" : "handset";
  }
  if (input.platform === "android") {
    const shortSide = resolveStableShortSide(input.screenWidth, input.screenHeight);
    return shortSide !== null && shortSide >= WAFL_ANDROID_TABLET_SHORT_SIDE_DP ? "tablet" : "handset";
  }
  return "other";
}

export function resolveWaflRootStackOrientation(input: WaflMobileDeviceClassInput): WaflRootStackOrientation {
  return resolveWaflMobileDeviceClass(input) === "handset" ? "portrait_up" : "default";
}

export function resolveWaflRuntimeOrientationAction(
  deviceClass: WaflMobileDeviceClass,
): WaflRuntimeOrientationAction {
  if (deviceClass === "handset") {
    return "lock-portrait-up";
  }
  if (deviceClass === "tablet") {
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

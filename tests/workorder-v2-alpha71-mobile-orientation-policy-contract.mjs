#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  WAFL_ANDROID_TABLET_SHORT_SIDE_DP,
  resolveWaflMobileDeviceClass,
  resolveWaflRootStackOrientation,
  resolveWaflRuntimeOrientationAction,
  shouldReconcileWaflRuntimeOrientation,
} from "../apps/mobile/domain/mobileOrientationPolicy.ts";
import { createWaflRuntimeOrientationCoordinator } from "../apps/mobile/domain/mobileOrientationRuntimeCoordinator.ts";

const read = (file) => fs.readFileSync(file, "utf8");
const classify = (platform, isPad, width, height) => resolveWaflMobileDeviceClass({
  platform,
  isPad,
  screenWidth: width,
  screenHeight: height,
});
const orientation = (platform, isPad, width, height) => resolveWaflRootStackOrientation({
  platform,
  isPad,
  screenWidth: width,
  screenHeight: height,
});

assert.equal(WAFL_ANDROID_TABLET_SHORT_SIDE_DP, 600);

assert.equal(classify("ios", false, 390, 844), "handset");
assert.equal(classify("ios", false, 844, 390), "handset");
assert.equal(orientation("ios", false, 390, 844), "portrait_up");
assert.equal(orientation("ios", false, 844, 390), "portrait_up");
assert.equal(classify("ios", true, 500, 900), "tablet", "native iPad idiom must outrank narrow window geometry");
assert.equal(orientation("ios", true, 1024, 1366), "default");
assert.equal(orientation("ios", true, 1366, 1024), "default");

assert.equal(classify("android", false, 360, 800), "handset");
assert.equal(classify("android", false, 800, 360), "handset");
assert.equal(orientation("android", false, 360, 800), "portrait_up");
assert.equal(orientation("android", false, 800, 360), "portrait_up");
assert.equal(classify("android", false, 599, 1280), "handset");
assert.equal(classify("android", false, 600, 960), "tablet");
assert.equal(classify("android", false, 960, 600), "tablet");
assert.equal(orientation("android", false, 800, 1280), "default");
assert.equal(orientation("android", false, 1280, 800), "default");
assert.equal(orientation("android", false, Number.NaN, 800), "portrait_up", "invalid Android geometry fails closed to handset");

assert.equal(classify("web", false, 390, 844), "other");
assert.equal(orientation("web", false, 390, 844), "default");
assert.equal(orientation("other", false, 390, 844), "default");
assert.equal(resolveWaflRuntimeOrientationAction("handset"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("tablet"), "unlock-default");
assert.equal(resolveWaflRuntimeOrientationAction("other"), "none");
assert.equal(shouldReconcileWaflRuntimeOrientation("background", "active"), true);
assert.equal(shouldReconcileWaflRuntimeOrientation("inactive", "active"), true);
assert.equal(shouldReconcileWaflRuntimeOrientation("active", "active"), false);
assert.equal(shouldReconcileWaflRuntimeOrientation("active", "background"), false);

const handsetCalls = [];
const handsetCoordinator = createWaflRuntimeOrientationCoordinator({
  action: "lock-portrait-up",
  initialAppState: "active",
  apply: async (action) => handsetCalls.push(action),
});
await handsetCoordinator.start();
await handsetCoordinator.handleAppStateChange("active");
await handsetCoordinator.handleAppStateChange("background");
await handsetCoordinator.handleAppStateChange("active");
assert.deepEqual(handsetCalls, ["lock-portrait-up", "lock-portrait-up"], "mount and one resume reconcile exactly once each");
handsetCoordinator.dispose();
await handsetCoordinator.handleAppStateChange("background");
await handsetCoordinator.handleAppStateChange("active");
assert.equal(handsetCalls.length, 2, "disposed owner must never reapply");

const tabletCalls = [];
const tabletCoordinator = createWaflRuntimeOrientationCoordinator({
  action: "unlock-default",
  initialAppState: "active",
  apply: async (action) => tabletCalls.push(action),
});
await tabletCoordinator.start();
assert.deepEqual(tabletCalls, ["unlock-default"]);

let releaseFirstApply;
const overlappingCalls = [];
const firstApplyGate = new Promise((resolve) => { releaseFirstApply = resolve; });
const coalescingCoordinator = createWaflRuntimeOrientationCoordinator({
  action: "lock-portrait-up",
  initialAppState: "active",
  apply: async (action) => {
    overlappingCalls.push(action);
    if (overlappingCalls.length === 1) {
      await firstApplyGate;
    }
  },
});
const firstApply = coalescingCoordinator.start();
await Promise.resolve();
await coalescingCoordinator.handleAppStateChange("background");
const resumedApply = coalescingCoordinator.handleAppStateChange("active");
releaseFirstApply();
await Promise.all([firstApply, resumedApply]);
assert.deepEqual(overlappingCalls, ["lock-portrait-up", "lock-portrait-up"], "overlap must serialize and coalesce to one resume application");

const policy = read("apps/mobile/domain/mobileOrientationPolicy.ts");
const coordinator = read("apps/mobile/domain/mobileOrientationRuntimeCoordinator.ts");
const runtimeOwner = read("apps/mobile/application/useWaflRuntimeOrientationPolicy.ts");
const layout = read("apps/mobile/app/_layout.tsx");
const appJson = JSON.parse(read("apps/mobile/app.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const currentState = read("docs/codex-current-state.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");

assert.match(policy, /Math\.min\(width, height\)/u, "Android fallback must use rotation-invariant shorter side");
assert.doesNotMatch(policy, /WorkOrder|Recipe|Media|Scene|viewport|gesture|renderer/iu);
assert.doesNotMatch(policy, /^import\s/mu, "policy owner must remain framework-free and Node-testable");
assert.match(layout, /Dimensions\.get\("screen"\)/u);
assert.match(layout, /Platform\.OS === "ios" && Platform\.isPad/u);
assert.match(layout, /useWaflRuntimeOrientationPolicy\(mobileDeviceClass\)/u);
assert.doesNotMatch(layout, /orientation:\s*rootStackOrientation/u, "ineffective root screenOptions-only mechanism must not return");
assert.doesNotMatch(layout, /<Stack\.Screen[\s\S]*orientation:/u, "an explicit route option is not a different native mechanism");
assert.match(runtimeOwner, /expo-screen-orientation/u);
assert.match(runtimeOwner, /lockAsync\(ScreenOrientation\.OrientationLock\.PORTRAIT_UP\)/u);
assert.match(runtimeOwner, /ScreenOrientation\.unlockAsync\(\)/u);
assert.match(runtimeOwner, /AppState\.addEventListener\("change"/u);
assert.match(runtimeOwner, /createWaflRuntimeOrientationCoordinator/u);
assert.match(coordinator, /shouldReconcileWaflRuntimeOrientation/u);
assert.match(coordinator, /queued = true/u, "rapid lifecycle changes must coalesce instead of overlapping native calls");
assert.match(coordinator, /disposed = true/u);
assert.doesNotMatch(runtimeOwner, /WorkOrder|Recipe|Media|Scene|viewport|gesture|renderer/iu);
assert.doesNotMatch(coordinator, /WorkOrder|Recipe|Media|Scene|viewport|gesture|renderer/iu);
assert.equal(appJson.expo.orientation, "default", "global Expo orientation must not portrait-lock tablets");
assert.equal(appJson.expo.ios.supportsTablet, true);
assert.equal(mobilePackage.dependencies["expo-screen-orientation"], "~55.0.20");
assert.equal(mobilePackage.dependencies["expo-device"], undefined);
assert.match(gallery, /accessibilityLabel="스케치, 준비 중" disabled/u);

for (const owner of [currentState, roadmap]) {
  assert.match(owner, /ALPHA71_PRE_DRAWING_PHYSICAL_ORIENTATION_LOCK_CORRECTION_IPHONE_REQA_REQUIRED/u);
  assert.match(owner, /physical[^\n]*FAIL|물리[^\n]*FAIL/iu);
  assert.match(owner, /PHYSICAL_RESULT_NOT_INFERRED/u);
  assert.match(owner, /2\.0\.0-alpha\.71/u);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha71-mobile-orientation-policy",
  previousPermanentInventoryRetained: 218,
  addedPermanentChecks: 1,
  finalPermanentInventory: 219,
  handsetOrientation: "portrait_up",
  tabletOrientation: "default",
  runtimeMechanism: "expo-screen-orientation",
  activeRouteScreenOptionsOnly: false,
  lifecycleReconcile: "mount-and-resume",
  globalExpoOrientation: "default",
  drawingImplementation: 0,
  physicalResultInferred: false,
}));

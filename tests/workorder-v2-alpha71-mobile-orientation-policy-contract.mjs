#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  WAFL_ANDROID_TABLET_SHORT_SIDE_DP,
  WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP,
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
assert.equal(WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP, 768);

assert.equal(classify("ios", false, 390, 844), "handset");
assert.equal(classify("ios", false, 844, 390), "handset");
assert.equal(orientation("ios", false, 390, 844), "portrait_up");
assert.equal(orientation("ios", false, 844, 390), "portrait_up");
assert.equal(classify("ios", true, 744, 1133), "compact-tablet");
assert.equal(classify("ios", true, 1133, 744), "compact-tablet", "rotation must not reclassify a compact tablet");
assert.equal(orientation("ios", true, 744, 1133), "portrait_up");
assert.equal(classify("ios", true, 1024, 1366), "regular-tablet");
assert.equal(orientation("ios", true, 1024, 1366), "default");
assert.equal(orientation("ios", true, 1366, 1024), "default");

assert.equal(classify("android", false, 360, 800), "handset");
assert.equal(classify("android", false, 800, 360), "handset");
assert.equal(orientation("android", false, 360, 800), "portrait_up");
assert.equal(orientation("android", false, 800, 360), "portrait_up");
assert.equal(classify("android", false, 599, 1280), "handset");
assert.equal(classify("android", false, 600, 960), "compact-tablet");
assert.equal(classify("android", false, 960, 600), "compact-tablet");
assert.equal(orientation("android", false, 600, 960), "portrait_up");
assert.equal(classify("android", false, 800, 1280), "regular-tablet");
assert.equal(orientation("android", false, 800, 1280), "default");
assert.equal(orientation("android", false, 1280, 800), "default");
assert.equal(orientation("android", false, Number.NaN, 800), "portrait_up", "invalid Android geometry fails closed to handset");

assert.equal(classify("web", false, 390, 844), "other");
assert.equal(orientation("web", false, 390, 844), "default");
assert.equal(orientation("other", false, 390, 844), "default");
assert.equal(resolveWaflRuntimeOrientationAction("handset"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("compact-tablet"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("regular-tablet"), "unlock-default");
assert.equal(resolveWaflRuntimeOrientationAction("regular-tablet", "product-sketch"), "lock-portrait-up");
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
assert.match(policy, /import nativeOrientationPolicy from "\.\.\/config\/waflNativeOrientationPolicy\.js"/u);
assert.doesNotMatch(policy, /from ["'](?:react|react-native|expo|@\/)/u, "policy owner must remain framework-free and Node-testable");
assert.match(layout, /Dimensions\.get\("screen"\)/u);
assert.match(layout, /Platform\.OS === "ios" && Platform\.isPad/u);
assert.match(layout, /WaflRuntimeOrientationPolicyProvider deviceClass=\{mobileDeviceClass\}/u);
assert.match(layout, /orientation:\s*rootStackOrientation/u, "the canonical device policy must reach the installed native-stack screen orientation prop");
assert.doesNotMatch(layout, /<Stack\.Screen[\s\S]*orientation:/u, "general WAFL orientation stays owned once at the root Stack");
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
assert.match(gallery, /"스케치, 준비 중"/u);
assert.match(gallery, /disabled=\{!props\.sketchAuthoringEnabled \|\| !props\.canEdit\}/u);
assert.match(gallery, /props\.sketchAuthoringEnabled \? "스케치" : "스케치\(준비 중\)"/u);

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
  compactTabletOrientation: "portrait_up",
  regularTabletOrientation: "default",
  runtimeMechanism: "expo-screen-orientation",
  rootNativeStackOrientationWired: true,
  lifecycleReconcile: "mount-and-resume",
  globalExpoOrientation: "default",
  drawingImplementation: 0,
  physicalResultInferred: false,
}));

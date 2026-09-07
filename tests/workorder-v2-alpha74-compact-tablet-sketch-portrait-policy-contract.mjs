#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import {
  WAFL_ANDROID_TABLET_SHORT_SIDE_DP,
  WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP,
  resolveWaflMobileDeviceClass,
  resolveWaflRootStackOrientation,
  resolveWaflRuntimeOrientationAction,
} from "../apps/mobile/domain/mobileOrientationPolicy.ts";
import {
  WORK_ORDER_RESPONSIVE_PANE_IDENTITY,
  resolveWorkOrderTabletPresentation,
  resolveWorkOrderResponsiveWorkspacePlan,
} from "../apps/mobile/domain/workOrderResponsiveWorkspacePolicy.ts";
import { createWaflRuntimeOrientationCoordinator } from "../apps/mobile/domain/mobileOrientationRuntimeCoordinator.ts";

const require = createRequire(import.meta.url);
const read = (file) => fs.readFileSync(file, "utf8");
const classify = (platform, isPad, width, height) => resolveWaflMobileDeviceClass({
  platform,
  isPad,
  screenWidth: width,
  screenHeight: height,
});
const rootOrientation = (platform, isPad, width, height) => resolveWaflRootStackOrientation({
  platform,
  isPad,
  screenWidth: width,
  screenHeight: height,
});

assert.equal(WAFL_ANDROID_TABLET_SHORT_SIDE_DP, 600);
assert.equal(WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP, 768, "the existing canonical responsive threshold is reused");

for (const [width, height] of [[390, 844], [844, 390]]) {
  assert.equal(classify("ios", false, width, height), "handset");
  assert.equal(rootOrientation("ios", false, width, height), "portrait_up");
}
for (const [width, height] of [[744, 1133], [1133, 744]]) {
  assert.equal(classify("ios", true, width, height), "compact-tablet");
  assert.equal(rootOrientation("ios", true, width, height), "portrait_up");
}
for (const [width, height] of [[768, 1024], [1024, 768], [1024, 1366], [1366, 1024]]) {
  assert.equal(classify("ios", true, width, height), "regular-tablet");
  assert.equal(rootOrientation("ios", true, width, height), "default");
}
for (const [width, height] of [[600, 960], [960, 600], [720, 1280], [1280, 720]]) {
  assert.equal(classify("android", false, width, height), "compact-tablet");
  assert.equal(rootOrientation("android", false, width, height), "portrait_up");
}
for (const [width, height] of [[800, 1280], [1280, 800]]) {
  assert.equal(classify("android", false, width, height), "regular-tablet");
  assert.equal(rootOrientation("android", false, width, height), "default");
}
assert.equal(classify("ios", true, Number.NaN, 1133), "compact-tablet", "invalid iPad geometry fails closed to portrait policy");
assert.equal(classify("android", false, Number.NaN, 960), "handset", "invalid Android geometry fails closed to handset");

assert.equal(resolveWaflRuntimeOrientationAction("handset"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("compact-tablet"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("regular-tablet"), "unlock-default");
assert.equal(resolveWaflRuntimeOrientationAction("other"), "none");
for (const deviceClass of ["handset", "compact-tablet", "regular-tablet"]) {
  assert.equal(resolveWaflRuntimeOrientationAction(deviceClass, "product-sketch"), "lock-portrait-up");
}
assert.equal(resolveWaflRuntimeOrientationAction("handset", "base"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("compact-tablet", "base"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("regular-tablet", "base"), "unlock-default");

let releaseBaseApply;
const serializedActions = [];
const baseApplyGate = new Promise((resolve) => { releaseBaseApply = resolve; });
const orientationCoordinator = createWaflRuntimeOrientationCoordinator({
  action: "unlock-default",
  initialAppState: "active",
  apply: async (action) => {
    serializedActions.push(action);
    if (serializedActions.length === 1) await baseApplyGate;
  },
});
const baseApply = orientationCoordinator.start();
await Promise.resolve();
const sketchApply = orientationCoordinator.updateAction("lock-portrait-up");
releaseBaseApply();
await Promise.all([baseApply, sketchApply]);
assert.deepEqual(serializedActions, ["unlock-default", "lock-portrait-up"], "a Product Sketch lock supersedes an in-flight base action in one serialized owner");
await orientationCoordinator.updateAction("unlock-default");
assert.deepEqual(serializedActions, ["unlock-default", "lock-portrait-up", "unlock-default"], "Sketch close restores the regular-tablet base allowance");
orientationCoordinator.dispose();

const policy = read("apps/mobile/domain/mobileOrientationPolicy.ts");
const runtimeOwner = read("apps/mobile/application/useWaflRuntimeOrientationPolicy.ts");
const rootLayout = read("apps/mobile/app/_layout.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const responsiveOwner = read("apps/mobile/domain/workOrderResponsiveWorkspacePolicy.ts");
const appJson = JSON.parse(read("apps/mobile/app.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const nativeOrientation = require("../apps/mobile/plugins/withWaflNativeOrientationPolicy.js");

assert.match(policy, /Math\.min\(width, height\)/u);
assert.match(policy, /WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP = nativeOrientationPolicy\.iosRegularTabletShortSidePoints/u);
assert.doesNotMatch(policy, /iPad mini|modelName|hardwareIdentifier|userAgent|setTimeout/iu);
assert.doesNotMatch(policy, /from ["'](?:react|react-native|expo|@\/)/u, "classification stays framework-free");
assert.match(rootLayout, /Dimensions\.get\("screen"\)/u);
assert.match(rootLayout, /WaflRuntimeOrientationPolicyProvider deviceClass=\{mobileDeviceClass\}/u);
assert.match(rootLayout, /orientation:\s*rootStackOrientation/u);
assert.match(runtimeOwner, /WaflMobileDeviceClassContext/u);
assert.match(runtimeOwner, /useWaflMobileDeviceClass/u);
assert.match(runtimeOwner, /resolveWaflRuntimeOrientationAction\(deviceClass, scope\)/u);
assert.match(runtimeOwner, /activeScopeCount > 0 \? "product-sketch" : "base"/u);
assert.match(runtimeOwner, /useWaflProductSketchOrientationPolicy/u);
assert.match(runtimeOwner, /OrientationLock\.PORTRAIT_UP/u);
assert.match(runtimeOwner, /ScreenOrientation\.unlockAsync\(\)/u);
assert.equal((`${policy}\n${runtimeOwner}\n${editor}`.match(/expo-screen-orientation/gu) ?? []).length, 1, "native orientation calls remain centralized");

const supportedOrientations = editor.match(/const WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS[^=]*= \[([\s\S]*?)\];/u);
assert.ok(supportedOrientations);
assert.deepEqual([...supportedOrientations[1].matchAll(/"([^"]+)"/gu)].map((match) => match[1]), ["portrait"]);
assert.match(editor, /useWaflProductSketchOrientationPolicy\(props\.visible\)/u);
assert.doesNotMatch(editor, /ScreenOrientation|lockAsync|unlockAsync|Dimensions|Platform|isPad|modelName|setTimeout/iu);
assert.match(editor, /supportedOrientations=\{WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS\}/u);

assert.match(experience, /useWaflMobileDeviceClass\(\)/u);
assert.match(experience, /resolveWorkOrderTabletPresentation/u);
assert.doesNotMatch(experience, /\bwidth >= 768\b/u, "responsive literal is centralized without changing the threshold");
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "handset", windowWidth: 1_133 }), false);
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "compact-tablet", windowWidth: 744 }), false);
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "compact-tablet", windowWidth: 1_133 }), false, "swapped compact-tablet dimensions cannot enter split presentation");
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "regular-tablet", windowWidth: 768 }), true);
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "regular-tablet", windowWidth: 1_366 }), true);
assert.equal(resolveWorkOrderResponsiveWorkspacePlan({ selected: true, tablet: false }).detailKey, WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail);
assert.equal(resolveWorkOrderResponsiveWorkspacePlan({ selected: true, tablet: true }).detailKey, WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail);
assert.match(responsiveOwner, /work-order-responsive-detail-host/u);
assert.match(experience, /key=\{WORK_ORDER_RESPONSIVE_PANE_IDENTITY\.detail\}/u);
assert.match(gallery, /visible=\{sketchVisible\}/u);

const nativePlist = nativeOrientation.applyWaflIosOrientationPolicy({});
assert.deepEqual(nativePlist.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
assert.equal(nativePlist["UISupportedInterfaceOrientations~ipad"].length, 4, "native iPad allowance stays broad for regular tablets");
assert.equal(nativeOrientation.resolveWaflAndroidNativeOrientationAction(600), "unrestricted-default", "runtime policy narrows compact tablets without native delta");
assert.equal(appJson.expo.orientation, "default");
assert.equal(appJson.expo.ios.supportsTablet, true);
assert.equal(mobilePackage.dependencies["expo-screen-orientation"], "~55.0.20");
assert.equal(mobilePackage.dependencies["expo-device"], undefined);

assert.match(read("lib/domain/drawing/contracts.ts"), /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.equal(fs.readdirSync(path.join("db", "v2", "migrations")).filter((name) => /^\d{3}_.+\.sql$/u.test(name)).length, 22);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha74-compact-tablet-sketch-portrait-policy",
  previousPermanentInventoryRetained: 268,
  addedPermanentChecks: 1,
  finalPermanentInventory: 269,
  deviceClasses: ["handset", "compact-tablet", "regular-tablet"],
  compactTabletBase: "portrait-only",
  regularTabletBase: "portrait-and-landscape",
  productSketch: "portrait-only-all-mobile-classes",
  responsiveDetailHostPreserved: true,
  dependencyNativeConfigEasSchemaMigrationDelta: [0, 0, 0, 0, 0, 0],
  physicalResultInferred: false,
}));

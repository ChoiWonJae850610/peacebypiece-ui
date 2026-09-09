#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import {
  WAFL_ANDROID_TABLET_SHORT_SIDE_DP,
  resolveWaflMobileDeviceClass,
  resolveWaflRuntimeOrientationAction,
} from "../apps/mobile/domain/mobileOrientationPolicy.ts";

const require = createRequire(import.meta.url);
const nativePolicy = require("../apps/mobile/plugins/withWaflNativeOrientationPolicy.js");
const policySeed = require("../apps/mobile/config/waflNativeOrientationPolicy.js");
const read = (file) => fs.readFileSync(file, "utf8");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

assert.equal(policySeed.androidTabletSmallestWidthDp, 600);
assert.equal(WAFL_ANDROID_TABLET_SHORT_SIDE_DP, 600, "runtime and native startup must share one threshold seed");

const infoPlist = nativePolicy.applyWaflIosOrientationPolicy({ Existing: true });
assert.deepEqual(infoPlist.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
assert.deepEqual(infoPlist["UISupportedInterfaceOrientations~ipad"], [
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
  "UIInterfaceOrientationLandscapeLeft",
  "UIInterfaceOrientationLandscapeRight",
]);
assert.equal(infoPlist.Existing, true);
assert.equal(infoPlist.UISupportedInterfaceOrientations.some((value) => value.includes("Landscape")), false);
assert.equal(infoPlist["UISupportedInterfaceOrientations~ipad"].filter((value) => value.includes("Landscape")).length, 2);

assert.equal(nativePolicy.resolveWaflAndroidNativeOrientationAction(599), "portrait");
assert.equal(nativePolicy.resolveWaflAndroidNativeOrientationAction(600), "unrestricted-default");
assert.equal(nativePolicy.resolveWaflAndroidNativeOrientationAction(699), "unrestricted-default");
assert.equal(nativePolicy.resolveWaflAndroidNativeOrientationAction(Number.NaN), "portrait");

const classifyAndroid = (width, height) => resolveWaflMobileDeviceClass({
  platform: "android",
  isPad: false,
  screenWidth: width,
  screenHeight: height,
});
assert.equal(classifyAndroid(599, 1_280), "handset");
assert.equal(classifyAndroid(1_280, 599), "handset", "rotation must not reclassify a phone");
assert.equal(classifyAndroid(600, 960), "compact-tablet");
assert.equal(classifyAndroid(960, 600), "compact-tablet", "rotation must not reclassify a compact tablet");
assert.equal(classifyAndroid(800, 1_280), "regular-tablet");
assert.equal(classifyAndroid(1_280, 800), "regular-tablet", "rotation must not reclassify a regular tablet");
assert.equal(resolveWaflRuntimeOrientationAction("handset"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("compact-tablet"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("regular-tablet"), "unlock-default");
assert.equal(resolveWaflRuntimeOrientationAction("regular-tablet", "product-sketch"), "lock-portrait-up");

const kotlinInput = `package com.wafl.app

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme)
    super.onCreate(null)
  }
}`;
const kotlinOutput = nativePolicy.applyWaflAndroidStartupOrientationPolicy(kotlinInput, "kt");
assert.match(kotlinOutput, /configuration\.smallestScreenWidthDp/u);
assert.match(kotlinOutput, /waflSmallestScreenWidthDp < 600/u);
assert.match(kotlinOutput, /SCREEN_ORIENTATION_PORTRAIT/u);
assert.doesNotMatch(kotlinOutput, /widthPixels|heightPixels|screenOrientation\s*=\s*"portrait"/u);
assert.ok(
  kotlinOutput.indexOf("SCREEN_ORIENTATION_PORTRAIT") < kotlinOutput.indexOf("setTheme(R.style.AppTheme)"),
  "handset orientation request must be the first generated startup action",
);
assert.ok(
  kotlinOutput.indexOf("SCREEN_ORIENTATION_PORTRAIT") < kotlinOutput.indexOf("super.onCreate(null)"),
  "handset orientation request must precede Activity super.onCreate and visible React startup",
);
assert.equal((kotlinOutput.match(/@generated begin wafl-native-handset-orientation/gu) ?? []).length, 1);
assert.equal(
  nativePolicy.applyWaflAndroidStartupOrientationPolicy(kotlinOutput, "kt"),
  kotlinOutput,
  "native generation must be idempotent",
);

const appJson = JSON.parse(read("apps/mobile/app.json"));
const pluginNames = appJson.expo.plugins.map((entry) => Array.isArray(entry) ? entry[0] : entry);
assert.ok(pluginNames.includes("./plugins/withWaflNativeOrientationPolicy"));
assert.equal(appJson.expo.orientation, "default", "global portrait must not lock tablets");
assert.equal(appJson.expo.ios.supportsTablet, true);

const pluginSource = read("apps/mobile/plugins/withWaflNativeOrientationPolicy.js");
const runtimeSource = read("apps/mobile/application/useWaflRuntimeOrientationPolicy.ts");
const stackSource = read("apps/mobile/app/_layout.tsx");
assert.match(pluginSource, /withInfoPlist/u);
assert.match(pluginSource, /withMainActivity/u);
assert.match(pluginSource, /smallestScreenWidthDp/u);
assert.match(runtimeSource, /OrientationLock\.PORTRAIT_UP/u);
assert.match(runtimeSource, /ScreenOrientation\.unlockAsync\(\)/u);
assert.doesNotMatch(pluginSource, /WorkOrder|Recipe|Drawing|R2|PDF|domain\/drawing|features\/work-orders/u);
assert.match(pluginSource, /windowScene/u, "the iOS native mask may use the active UIWindowScene without coupling to Drawing Scene data");
assert.doesNotMatch(stackSource, /orientation:\s*["']portrait/u);
assert.match(stackSource, /orientation:\s*rootStackOrientation/u, "runtime reconciliation is paired with the installed native-stack orientation declaration");
assert.doesNotMatch(pluginSource, /android:screenOrientation/u, "Android tablet must not receive a global manifest portrait lock");

const drawingHashes = {
  "adapters.ts": "ceda989898686b350eeda736571566c7cc2050ea450228fa68a7c04d8fee6cd8",
  // Alpha.73B's approved additive v1 text-kind evolution is the current protected foundation identity.
  "contracts.ts": "2f1b9caa5a949d161da51e9acabc325668b213e31922f26e9b8788cedda1657b",
  // Alpha.75 partial Eraser adds one framework-free swept WORLD-corridor owner without changing Scene v1.
  "eraseFreehand.ts": "e7bb947b39fc0a2a06da22f8b6f14d8a6d47114bba198bc8963ae05b77897ee2",
  "history.ts": "b0e68332df7d345c2b9f138609819d0602593127fe6afe3dc838e727d783d510",
  // Alpha.76 pickup UX adds only canonical-bounds selected fallback helpers to the pure WORLD hit-test owner.
  "hitTest.ts": "fbf4a09cd55d1dd769af6f1b8ce6549a5f28c2801e2375919b298a1e9eeef607",
  // Alpha.76 keeps Cover/stable IDs while moving continuous native pinch geometry to stable page coordinates.
  // Alpha.76 adds transient clamp-boundary gesture rebase while preserving Scene-v1 persistence.
  "cameraGesture.ts": "fc7f382058a1b952d2ad73c9c5a015f7c8b4158def46ffdcaffb59a04df3a7ef",
  // Alpha.76 exports the additive WORLD translation, surface-fit, and transient camera owners.
  "index.ts": "8344fde89aceb66670144ad1b96ce553eed8d13c870ac24e9b907b61c62303a8",
  "scene.ts": "a6aa1415c8f9c6922af50af29f00f4f066a79f00b7a741434e66d898fabfedda",
  "surfaceLayout.ts": "21624f2fd362a2387c1b72cb7c08a3c28d64b66440a4aba0b75870e81fd7cdd1",
  "translation.ts": "06eed2321324f1c95db7ef62a9ef87bbb77991a1b37d6e7afa05ffa724e3886b",
  "viewport.ts": "d5070d7f2bc44c90f3f6f4f779fb2df03954318af1b21b8f3ef15129538383be",
};
for (const [name, expected] of Object.entries(drawingHashes)) {
  assert.equal(sha256(`lib/domain/drawing/${name}`), expected, `Drawing Foundation changed unexpectedly: ${name}`);
}
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
assert.match(gallery, /"스케치, 준비 중"/u);
assert.match(gallery, /disabled=\{!props\.sketchAuthoringEnabled \|\| !props\.canEdit\}/u);
for (const owner of [
  read("docs/codex-current-state.md"),
  read("docs/project/app-v2/08-roadmap-2.0.md"),
]) {
  assert.match(owner, /ALPHA72_DRAWING_RENDERER_POC_ENTRY_GATE_IPHONE_REQA_REQUIRED/u);
  assert.match(owner, /smallestScreenWidthDp/u);
  assert.match(owner, /RECOMMENDATION_PENDING_OWNER_PHYSICAL_POC|physical result is not inferred/iu);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha72-native-orientation-stabilization",
  previousPermanentInventoryRetained: 221,
  addedPermanentChecks: 1,
  finalPermanentInventory: 222,
  iosPhone: "portrait-only-native-metadata",
  iosTablet: "portrait-and-landscape-native-metadata",
  androidPhone: "portrait-before-super-onCreate",
  androidTabletNative: "unrestricted-default",
  compactTabletRuntime: "portrait-up",
  regularTabletRuntime: "unrestricted-default",
  runtimeSafetyNet: "expo-screen-orientation",
  drawingFoundationChanged: "alpha76-additive-translation-selected-pickup-and-surface-fit-owners",
  physicalResultInferred: false,
}));

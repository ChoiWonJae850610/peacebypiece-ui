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
assert.equal(classifyAndroid(600, 960), "tablet");
assert.equal(classifyAndroid(960, 600), "tablet", "rotation must not reclassify a tablet");
assert.equal(resolveWaflRuntimeOrientationAction("handset"), "lock-portrait-up");
assert.equal(resolveWaflRuntimeOrientationAction("tablet"), "unlock-default");

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
assert.doesNotMatch(pluginSource, /WorkOrder|Recipe|Drawing|Scene|R2|PDF/u);
assert.doesNotMatch(stackSource, /orientation:\s*["']portrait/u);
assert.doesNotMatch(pluginSource, /android:screenOrientation/u, "Android tablet must not receive a global manifest portrait lock");

const drawingHashes = {
  "adapters.ts": "ceda989898686b350eeda736571566c7cc2050ea450228fa68a7c04d8fee6cd8",
  "contracts.ts": "c6c70cb2748ae1cb9fd95cb540fe21f5adfcd67a9abbb0fa0115508743cf8b62",
  "history.ts": "b0e68332df7d345c2b9f138609819d0602593127fe6afe3dc838e727d783d510",
  "index.ts": "e370028eee95dce7d5464a147985a5b421fd18257b165f72e714df7c4ac99a1b",
  "scene.ts": "f4ab19825166166388228a0061c05228a5cbfed58e1e3cf6d2c7b04e42f95385",
  "viewport.ts": "d5070d7f2bc44c90f3f6f4f779fb2df03954318af1b21b8f3ef15129538383be",
};
for (const [name, expected] of Object.entries(drawingHashes)) {
  assert.equal(sha256(`lib/domain/drawing/${name}`), expected, `Drawing Foundation changed unexpectedly: ${name}`);
}
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
assert.match(gallery, /"스케치, 준비 중"/u);
assert.match(gallery, /disabled=\{!props\.drawingRendererPocEnabled\}/u);
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
  androidTablet: "unrestricted-default",
  runtimeSafetyNet: "expo-screen-orientation",
  drawingFoundationChanged: false,
  physicalResultInferred: false,
}));

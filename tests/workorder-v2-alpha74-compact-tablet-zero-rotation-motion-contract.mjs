#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  resolveWaflMobileDeviceClass,
  resolveWaflRootStackOrientation,
} from "../apps/mobile/domain/mobileOrientationPolicy.ts";
import {
  resolveWorkOrderResponsiveWorkspacePlan,
  resolveWorkOrderTabletPresentation,
  WORK_ORDER_RESPONSIVE_PANE_IDENTITY,
} from "../apps/mobile/domain/workOrderResponsiveWorkspacePolicy.ts";

const require = createRequire(import.meta.url);
const read = (file) => fs.readFileSync(file, "utf8");
const rootLayout = read("apps/mobile/app/_layout.tsx");
const runtimeOwner = read("apps/mobile/application/useWaflRuntimeOrientationPolicy.ts");
const policy = read("apps/mobile/domain/mobileOrientationPolicy.ts");
const responsivePolicy = read("apps/mobile/domain/workOrderResponsiveWorkspacePolicy.ts");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const sketch = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const nativeStackTypes = read("apps/mobile/node_modules/@react-navigation/native-stack/lib/typescript/src/types.d.ts");
const nativeStackRuntime = read("apps/mobile/node_modules/@react-navigation/native-stack/lib/module/views/NativeStackView.native.js");
const screensTypes = read("apps/mobile/node_modules/react-native-screens/lib/typescript/types.d.ts");
const appJson = JSON.parse(read("apps/mobile/app.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const nativeOrientation = require("../apps/mobile/plugins/withWaflNativeOrientationPolicy.js");

const deviceInput = (platform, isPad, screenWidth, screenHeight) => ({
  platform,
  isPad,
  screenWidth,
  screenHeight,
});

for (const dimensions of [[390, 844], [844, 390]]) {
  const input = deviceInput("ios", false, ...dimensions);
  assert.equal(resolveWaflMobileDeviceClass(input), "handset");
  assert.equal(resolveWaflRootStackOrientation(input), "portrait_up");
}
for (const dimensions of [[744, 1133], [1133, 744]]) {
  const input = deviceInput("ios", true, ...dimensions);
  assert.equal(resolveWaflMobileDeviceClass(input), "compact-tablet");
  assert.equal(resolveWaflRootStackOrientation(input), "portrait_up");
  assert.equal(resolveWorkOrderTabletPresentation({
    deviceClass: resolveWaflMobileDeviceClass(input),
    windowWidth: dimensions[0],
  }), false, "compact tablet remains phone-like even when transient width is landscape-wide");
}
for (const dimensions of [[1024, 1366], [1366, 1024]]) {
  const input = deviceInput("ios", true, ...dimensions);
  assert.equal(resolveWaflMobileDeviceClass(input), "regular-tablet");
  assert.equal(resolveWaflRootStackOrientation(input), "default");
  assert.equal(resolveWorkOrderTabletPresentation({
    deviceClass: resolveWaflMobileDeviceClass(input),
    windowWidth: dimensions[0],
  }), true);
}
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "other", windowWidth: 767 }), false);
assert.equal(resolveWorkOrderTabletPresentation({ deviceClass: "other", windowWidth: 768 }), true);

assert.match(nativeStackTypes, /orientation\?: ScreenProps\['screenOrientation'\]/u);
assert.match(screensTypes, /ScreenOrientationTypes = 'default'[\s\S]*'portrait_up'/u);
assert.match(nativeStackRuntime, /screenOrientation:\s*orientation/u, "installed native-stack must forward the option to react-native-screens");
assert.equal(mobilePackage.dependencies["@react-navigation/native-stack"], undefined, "Expo Router retains transitive native-stack ownership");
assert.equal(mobilePackage.dependencies["react-native-screens"], "~4.23.0");
assert.match(rootLayout, /resolveWaflRootStackOrientation\(mobileDeviceInput\)/u);
assert.match(rootLayout, /orientation:\s*rootStackOrientation/u);
assert.equal((rootLayout.match(/orientation:\s*rootStackOrientation/gu) ?? []).length, 1);
assert.doesNotMatch(rootLayout, /<Stack\.Screen[\s\S]*orientation:/u);

assert.match(runtimeOwner, /WaflMobileDeviceClassContext/u);
assert.match(runtimeOwner, /useWaflMobileDeviceClass/u);
assert.match(runtimeOwner, /OrientationLock\.PORTRAIT_UP/u);
assert.match(runtimeOwner, /ScreenOrientation\.unlockAsync\(\)/u);
assert.match(experience, /const mobileDeviceClass = useWaflMobileDeviceClass\(\)/u);
assert.match(experience, /resolveWorkOrderTabletPresentation\(\{/u);
assert.doesNotMatch(experience, /width\s*>=\s*WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP/u);
assert.match(responsivePolicy, /WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP/u);
assert.doesNotMatch(`${policy}\n${responsivePolicy}\n${rootLayout}\n${experience}`, /iPad mini|modelName|hardwareIdentifier/iu);
assert.doesNotMatch(`${policy}\n${responsivePolicy}\n${rootLayout}`, /setTimeout|keyboardHeight/iu);

const phonePlan = resolveWorkOrderResponsiveWorkspacePlan({ tablet: false, selected: true });
const tabletPlan = resolveWorkOrderResponsiveWorkspacePlan({ tablet: true, selected: true });
assert.equal(phonePlan.detailKey, WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail);
assert.equal(tabletPlan.detailKey, WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail);
assert.match(experience, /key=\{WORK_ORDER_RESPONSIVE_PANE_IDENTITY\.detail\}/u);

assert.match(runtimeOwner, /activeScopeCount > 0 \? "product-sketch" : "base"/u);
assert.match(sketch, /useWaflProductSketchOrientationPolicy\(props\.visible\)/u);
assert.match(sketch, /supportedOrientations=\{WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS\}/u);
assert.deepEqual(
  [...sketch.matchAll(/const WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS[^=]*= \[([\s\S]*?)\];/gu)]
    .flatMap((match) => [...match[1].matchAll(/"([^"]+)"/gu)].map((value) => value[1])),
  ["portrait"],
);

assert.equal(appJson.expo.orientation, "default");
assert.equal(appJson.expo.ios.requireFullScreen, true);
const generated = nativeOrientation.applyWaflIosOrientationPolicy({ UIRequiresFullScreen: true });
assert.equal(generated.UIRequiresFullScreen, true);
assert.deepEqual(generated.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
assert.equal(generated["UISupportedInterfaceOrientations~ipad"].length, 4);

assert.match(read("lib/domain/drawing/contracts.ts"), /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.equal(fs.readdirSync(path.join("db", "v2", "migrations")).filter((name) => /^\d{3}_.+\.sql$/u.test(name)).length, 22);
assert.equal(fs.existsSync("apps/mobile/ios"), false, "this correction must not add a custom native module");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha74-compact-tablet-zero-rotation-motion",
  previousPermanentInventoryRetained: 270,
  addedPermanentChecks: 1,
  finalPermanentInventory: 271,
  nativeStackOrientationLiterals: ["portrait_up", "default"],
  compactTabletResponsivePresentation: "phone-like-stable",
  regularTabletResponsivePresentation: "tablet-eligible",
  stableDetailHost: WORK_ORDER_RESPONSIVE_PANE_IDENTITY.detail,
  easBuildResignReinstall: [0, 0, 0],
  dependencyNativeConfigEasSchemaMigrationDelta: [0, 0, 0, 0, 0, 0],
  physicalResultInferred: false,
}));

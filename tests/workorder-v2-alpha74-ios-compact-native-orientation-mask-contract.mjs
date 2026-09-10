#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import {
  WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP,
  resolveWaflMobileDeviceClass,
  resolveWaflRootStackOrientation,
} from "../apps/mobile/domain/mobileOrientationPolicy.ts";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(repoRoot, file), "utf8");
const nativePolicy = require("../apps/mobile/plugins/withWaflNativeOrientationPolicy.js");
const policySeed = require("../apps/mobile/config/waflNativeOrientationPolicy.js");

assert.equal(policySeed.iosRegularTabletShortSidePoints, 768);
assert.equal(WAFL_RESPONSIVE_TABLET_BREAKPOINT_DP, policySeed.iosRegularTabletShortSidePoints);

for (const [width, height] of [[390, 844], [844, 390]]) {
  assert.equal(nativePolicy.resolveWaflIosNativeOrientationMask({ isPad: false, screenWidth: width, screenHeight: height }), "portrait");
}
for (const [width, height] of [[744, 1133], [1133, 744]]) {
  const input = { platform: "ios", isPad: true, screenWidth: width, screenHeight: height };
  assert.equal(nativePolicy.resolveWaflIosNativeOrientationMask({ isPad: true, screenWidth: width, screenHeight: height }), "portrait");
  assert.equal(resolveWaflMobileDeviceClass(input), "compact-tablet");
  assert.equal(resolveWaflRootStackOrientation(input), "portrait_up");
}
for (const [width, height] of [[768, 1024], [1024, 768], [1024, 1366], [1366, 1024]]) {
  const input = { platform: "ios", isPad: true, screenWidth: width, screenHeight: height };
  assert.equal(nativePolicy.resolveWaflIosNativeOrientationMask({ isPad: true, screenWidth: width, screenHeight: height }), "inherited-default");
  assert.equal(resolveWaflMobileDeviceClass(input), "regular-tablet");
  assert.equal(resolveWaflRootStackOrientation(input), "default");
}

const sdk55AppDelegate = `import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;
const generated = nativePolicy.applyWaflIosAppOrientationMask(sdk55AppDelegate, "swift");
assert.match(generated, /override func application\([\s\S]*supportedInterfaceOrientationsFor window: UIWindow\?/u);
assert.match(generated, /UIDevice\.current\.userInterfaceIdiom == \.pad/u);
assert.match(generated, /window\?\.windowScene\?\.screen\.bounds \?\? UIScreen\.main\.bounds/u);
assert.match(generated, /min\(screenBounds\.width, screenBounds\.height\)/u);
assert.match(generated, /waflRegularTabletShortSidePoints: CGFloat = 768/u);
assert.match(generated, /guard shortSidePoints >= Self\.waflRegularTabletShortSidePoints else \{[\s\S]*return \.portrait/u);
assert.match(generated, /return super\.application\([\s\S]*supportedInterfaceOrientationsFor: window/u);
assert.equal((generated.match(/@generated begin wafl-ios-compact-app-orientation-mask/gu) ?? []).length, 1);
assert.equal(nativePolicy.applyWaflIosAppOrientationMask(generated, "swift"), generated, "fresh native generation must be idempotent");
assert.throws(() => nativePolicy.applyWaflIosAppOrientationMask(sdk55AppDelegate, "objc"), /Unsupported iOS AppDelegate language/u);
assert.doesNotMatch(generated, /iPad mini|modelName|hardwareIdentifier|machineIdentifier/iu);

const expoAppDelegate = read("apps/mobile/node_modules/expo/ios/AppDelegates/ExpoAppDelegate.swift");
const subscriberManager = read("apps/mobile/node_modules/expo-modules-core/ios/AppDelegates/ExpoAppDelegateSubscriberManager.swift");
const screenOrientationDelegate = read("apps/mobile/node_modules/expo-screen-orientation/ios/ScreenOrientationAppDelegate.swift");
assert.match(expoAppDelegate, /supportedInterfaceOrientationsFor window:[\s\S]*ExpoAppDelegateSubscriberManager\.application/u);
assert.match(subscriberManager, /requestedOrientation\.intersection\(result\)/u);
assert.match(screenOrientationDelegate, /supportedInterfaceOrientationsFor window:[\s\S]*currentOrientationMask/u);

const appJson = JSON.parse(read("apps/mobile/app.json"));
const infoPlist = nativePolicy.applyWaflIosOrientationPolicy({ UIRequiresFullScreen: true });
assert.equal(appJson.expo.ios.requireFullScreen, true);
assert.equal(infoPlist.UIRequiresFullScreen, true);
assert.deepEqual(infoPlist.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
assert.deepEqual(infoPlist["UISupportedInterfaceOrientations~ipad"], [
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
  "UIInterfaceOrientationLandscapeLeft",
  "UIInterfaceOrientationLandscapeRight",
]);

const pluginSource = read("apps/mobile/plugins/withWaflNativeOrientationPolicy.js");
const rootLayout = read("apps/mobile/app/_layout.tsx");
const runtimeOwner = read("apps/mobile/application/useWaflRuntimeOrientationPolicy.ts");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const responsivePolicy = read("apps/mobile/domain/workOrderResponsiveWorkspacePolicy.ts");
const sketch = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
assert.match(pluginSource, /withAppDelegate/u);
assert.match(rootLayout, /orientation:\s*rootStackOrientation/u);
assert.match(runtimeOwner, /OrientationLock\.PORTRAIT_UP/u);
assert.match(runtimeOwner, /ScreenOrientation\.unlockAsync\(\)/u);
assert.match(experience, /resolveWorkOrderTabletPresentation\(\{/u);
assert.match(responsivePolicy, /deviceClass === "handset" \|\| input\.deviceClass === "compact-tablet"/u);
assert.match(experience, /testID="work-order-responsive-detail-host"/u);
assert.match(sketch, /supportedOrientations=\{WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS\}/u);
assert.doesNotMatch(`${pluginSource}\n${rootLayout}\n${runtimeOwner}`, /setTimeout|iPad mini|hardwareIdentifier/iu);

const androidBefore = nativePolicy.applyWaflAndroidStartupOrientationPolicy(
  "class MainActivity : ReactActivity() {\n  override fun onCreate(savedInstanceState: Bundle?) {\n    super.onCreate(null)\n  }\n}",
  "kt",
);
assert.match(androidBefore, /waflSmallestScreenWidthDp < 600/u);
assert.doesNotMatch(androidBefore, /768|waflRegularTabletShortSidePoints/u);

assert.match(read("lib/domain/drawing/contracts.ts"), /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.equal(fs.readdirSync(path.join(repoRoot, "db", "v2", "migrations")).filter((name) => /^\d{3}_.+\.sql$/u.test(name)).length, 22);
assert.equal(fs.existsSync(path.join(repoRoot, "apps", "mobile", "ios")), false, "generated iOS source remains config-plugin owned, not manually tracked");
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:74|75|76|77|78)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha74-ios-compact-native-orientation-mask",
  previousPermanentInventoryRetained: 271,
  addedPermanentChecks: 1,
  finalPermanentInventory: 272,
  nativeMask: {
    handset: "portrait",
    compactTablet: "portrait",
    regularTablet: "inherited-default",
  },
  nativeClassification: "logical-short-side-768-orientation-invariant",
  infoPlistIpadLandscapePreserved: true,
  rootStackAndRuntimeLayersPreserved: true,
  iosDevelopmentBuildMaximum: 1,
  apiSchemaMigrationDelta: [0, 0, 0],
  physicalResultInferred: false,
}));

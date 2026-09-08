#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, "..");
const mobileRoot = path.join(repoRoot, "apps", "mobile");
const read = (file) => fs.readFileSync(path.join(repoRoot, file), "utf8");

const appJson = JSON.parse(read("apps/mobile/app.json"));
const easJson = JSON.parse(read("apps/mobile/eas.json"));
const nativeOrientation = require("../apps/mobile/plugins/withWaflNativeOrientationPolicy.js");

assert.equal(appJson.expo.orientation, "default", "regular/large tablets must retain runtime-managed rotation");
assert.equal(appJson.expo.ios.supportsTablet, true);
assert.equal(appJson.expo.ios.requireFullScreen, true, "iPad orientation locks require fullscreen native eligibility");
assert.equal(appJson.expo.ios.bundleIdentifier, "com.wafl.app");
assert.match(appJson.expo.extra.appVersion, /^2\.0\.0-alpha\.(?:74|75)$/u);

const generated = nativeOrientation.applyWaflIosOrientationPolicy({ UIRequiresFullScreen: true });
assert.equal(generated.UIRequiresFullScreen, true, "orientation plugin must preserve Expo's generated fullscreen prerequisite");
assert.deepEqual(generated.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
assert.deepEqual(generated["UISupportedInterfaceOrientations~ipad"], [
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
  "UIInterfaceOrientationLandscapeLeft",
  "UIInterfaceOrientationLandscapeRight",
]);

const introspected = JSON.parse(execFileSync(
  process.execPath,
  ["node_modules/expo/bin/cli", "config", "--type", "introspect", "--json"],
  {
    cwd: mobileRoot,
    encoding: "utf8",
    env: { ...process.env, APP_VARIANT: "development" },
    maxBuffer: 16 * 1024 * 1024,
  },
));
const infoPlist = introspected?._internal?.modResults?.ios?.infoPlist;
assert.ok(infoPlist, "Expo introspection must expose the generated iOS Info.plist");
assert.equal(infoPlist.UIRequiresFullScreen, true);
assert.deepEqual(infoPlist.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
assert.deepEqual(infoPlist["UISupportedInterfaceOrientations~ipad"], [
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
  "UIInterfaceOrientationLandscapeLeft",
  "UIInterfaceOrientationLandscapeRight",
]);
assert.equal(infoPlist.NSAppTransportSecurity?.NSAllowsArbitraryLoads, undefined);
assert.equal(
  infoPlist.NSAppTransportSecurity?.NSExceptionDomains?.["100.64.0.0/10"]?.NSExceptionAllowsInsecureHTTPLoads,
  true,
  "development-only private Metro ATS exception must remain exact",
);

assert.equal(easJson.cli.version, "21.0.1");
assert.deepEqual(Object.keys(easJson.build), ["development"]);
assert.equal(easJson.build.development.developmentClient, true);
assert.equal(easJson.build.development.distribution, "internal");
assert.equal(easJson.build.development.env.APP_VARIANT, "development");
assert.equal(easJson.submit, undefined);

const runtimePolicy = read("apps/mobile/domain/mobileOrientationPolicy.ts");
const runtimeOwner = read("apps/mobile/application/useWaflRuntimeOrientationPolicy.ts");
const responsiveHost = read("apps/mobile/domain/workOrderResponsiveWorkspacePolicy.ts");
const sketch = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
assert.match(runtimePolicy, /"compact-tablet"/u);
assert.match(runtimePolicy, /"regular-tablet"/u);
assert.match(runtimeOwner, /OrientationLock\.PORTRAIT_UP/u);
assert.match(runtimeOwner, /ScreenOrientation\.unlockAsync\(\)/u);
assert.match(responsiveHost, /WORK_ORDER_RESPONSIVE_PANE_IDENTITY/u);
assert.match(sketch, /supportedOrientations=\{WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS\}/u);
assert.deepEqual(
  [...sketch.matchAll(/const WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS[^=]*= \[([\s\S]*?)\];/gu)]
    .flatMap((match) => [...match[1].matchAll(/"([^"]+)"/gu)].map((value) => value[1])),
  ["portrait"],
);

assert.equal(fs.readdirSync(path.join(repoRoot, "db", "v2", "migrations")).filter((name) => /^\d{3}_.+\.sql$/u.test(name)).length, 22);
assert.match(read("lib/constants/version.ts"), /2\.0\.0-alpha\.(?:74|75)/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha74-ios-fullscreen-orientation-native-prerequisite",
  previousPermanentInventoryRetained: 269,
  addedPermanentChecks: 1,
  finalPermanentInventory: 270,
  expoRequireFullScreen: true,
  generatedUIRequiresFullScreen: true,
  iosPhoneOrientations: infoPlist.UISupportedInterfaceOrientations,
  iosTabletOrientations: infoPlist["UISupportedInterfaceOrientations~ipad"],
  easCli: easJson.cli.version,
  buildProfile: "development",
  dependencyDelta: 0,
  apiSchemaMigrationDelta: [0, 0, 0],
  physicalResultInferred: false,
}));

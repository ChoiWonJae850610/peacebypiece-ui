#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const runtimeOrientation = read("apps/mobile/application/useWaflRuntimeOrientationPolicy.ts");
const rootLayout = read("apps/mobile/app/_layout.tsx");
const appJson = JSON.parse(read("apps/mobile/app.json"));
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const nativeOrientation = require("../apps/mobile/plugins/withWaflNativeOrientationPolicy.js");

const supportedOrientations = editor.match(
  /const WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS[^=]*= \[([\s\S]*?)\];/u,
);
assert.ok(supportedOrientations, "Product Sketch must own one explicit fullscreen orientation contract");
assert.deepEqual(
  [...supportedOrientations[1].matchAll(/"([^"]+)"/gu)].map((match) => match[1]),
  ["portrait"],
);
assert.match(
  editor,
  /<Modal[^>]*presentationStyle="fullScreen"[^>]*supportedOrientations=\{WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS\}[^>]*visible=\{props\.visible\}/u,
);

const phonePlist = nativeOrientation.applyWaflIosOrientationPolicy({});
assert.deepEqual(phonePlist.UISupportedInterfaceOrientations, ["UIInterfaceOrientationPortrait"]);
assert.deepEqual(phonePlist["UISupportedInterfaceOrientations~ipad"], [
  "UIInterfaceOrientationPortrait",
  "UIInterfaceOrientationPortraitUpsideDown",
  "UIInterfaceOrientationLandscapeLeft",
  "UIInterfaceOrientationLandscapeRight",
]);
assert.match(runtimeOrientation, /ScreenOrientation\.unlockAsync\(\)/u, "regular tablet base Runtime must remain unlocked/default");
assert.match(runtimeOrientation, /OrientationLock\.PORTRAIT_UP/u, "handset Runtime must remain portrait-up");
assert.match(runtimeOrientation, /useWaflProductSketchOrientationPolicy/u, "Product Sketch must use the canonical Runtime scope owner");
assert.equal(appJson.expo.orientation, "default", "global config must not lock tablets");
assert.equal(appJson.expo.ios.supportsTablet, true);
assert.doesNotMatch(rootLayout, /orientation:\s*["']portrait/u);

const canvasLayoutOwner = editor.slice(
  editor.indexOf("function onCanvasLayout"),
  editor.indexOf("function makeSaveIdentity"),
);
assert.match(canvasLayoutOwner, /viewportGenerationRef\.current \+= 1;[\s\S]*discardActiveGesture\(\);[\s\S]*setViewport\(next\)/u);
assert.doesNotMatch(canvasLayoutOwner, /props\.onClose|requestClose|closeEditorSession|setSketchVisible|save\(/u);
assert.match(editor, /if \(!activeGestureUsesCurrentViewport\(\)\) \{[\s\S]*discardActiveGesture\(\);[\s\S]*return;/u);

assert.match(gallery, /onClose=\{\(\) => setSketchVisible\(false\)\}/u);
assert.equal((gallery.match(/setSketchVisible\(false\)/gu) ?? []).length, 1, "only explicit Sketch close may clear parent visibility");
assert.doesNotMatch(gallery, /supportedOrientations=/u, "unrelated image fullscreen behavior is outside this correction");
assert.doesNotMatch(editor, /Platform|Dimensions|isPad|modelName|screenWidth|screenHeight/u, "Sketch must not classify device models or dimensions");

assert.equal(mobilePackage.dependencies["expo-screen-orientation"], "~55.0.20");
assert.equal(mobilePackage.dependencies["react-native-svg"], "15.15.3");
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.equal(
  fs.readdirSync("db/v2/migrations").filter((name) => /^\d{3}_.+\.sql$/u.test(name)).length,
  22,
);
assert.match(read("lib/domain/drawing/contracts.ts"), /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.match(gallery, /disabled=\{!props\.sketchAuthoringEnabled \|\| !props\.canEdit\}/u, "Production Sketch gate must remain unchanged");

const featureTsx = [];
function collectTsx(directory) {
  for (const name of fs.readdirSync(directory)) {
    const absolute = path.join(directory, name);
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) collectTsx(absolute);
    else if (name.endsWith(".tsx") && read(absolute).includes("supportedOrientations=")) featureTsx.push(absolute.replaceAll("\\", "/"));
  }
}
collectTsx("apps/mobile/features");
assert.deepEqual(featureTsx, ["apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx"]);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha74-ipad-sketch-orientation-lifecycle-correction",
  previousPermanentInventoryRetained: 266,
  addedPermanentChecks: 1,
  finalPermanentInventory: 267,
  sketchSupportedOrientations: ["portrait"],
  iosPhoneNative: "portrait-only",
  iosTabletNative: "portrait-and-landscape",
  regularTabletBaseRuntime: "unlock-default",
  productSketchRuntime: "portrait-up",
  unrelatedFullscreenBehaviorDelta: 0,
  schemaApiMigrationDelta: 0,
  physicalResultInferred: false,
}));

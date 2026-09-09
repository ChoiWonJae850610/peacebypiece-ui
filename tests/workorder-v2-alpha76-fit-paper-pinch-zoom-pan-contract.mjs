#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-camera-"));
try {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc",
    "--module", "commonjs",
    "--moduleResolution", "node",
    "--target", "ES2020",
    "--strict",
    "--skipLibCheck",
    "--rootDir", "lib/domain/drawing",
    "--outDir", compiledDirectory,
    ...fs.readdirSync("lib/domain/drawing").filter((name) => name.endsWith(".ts")).map((name) => `lib/domain/drawing/${name}`),
  ], { cwd: process.cwd(), stdio: "pipe" });
} catch (error) {
  fs.rmSync(compiledDirectory, { recursive: true, force: true });
  throw error;
}
process.on("exit", () => fs.rmSync(compiledDirectory, { recursive: true, force: true }));

const require = createRequire(import.meta.url);
const drawing = require(path.join(compiledDirectory, "index.js"));
const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const cameraPolicy = read("lib/domain/drawing/cameraGesture.ts");
const viewportPolicy = read("lib/domain/drawing/viewport.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const scenePolicy = read("lib/domain/drawing/scene.ts");
const api = read("apps/mobile/lib/api/drawingApi.ts");
const epsilon = 1e-8;
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < epsilon, `${label}: ${actual} ~= ${expected}`);
const touch = (localX, localY, pageX = localX + 40, pageY = localY + 80) => Object.freeze({ localX, localY, pageX, pageY });

const viewport = Object.freeze({ width: 400, height: 600 });
const fitCamera = drawing.createDrawingCamera();
assert.deepEqual(fitCamera, { centerX: 500, centerY: 700, zoom: 1 }, "default camera is canonical WORLD center at Fit zoom");
const fitTransform = drawing.resolveDrawingViewportTransform(fitCamera, viewport);
near(fitTransform.fitScale, 0.4, "Fit uses canonical uniform transform");
near(fitTransform.scale, 0.4, "Fit scale equals fitScale at zoom 1");
assert.deepEqual(drawing.worldToScreen({ x: 0, y: 0 }, fitCamera, viewport), { x: 0, y: 20 }, "Fit paper top-left is centered in workbench");
assert.deepEqual(drawing.worldToScreen({ x: 1000, y: 1400 }, fitCamera, viewport), { x: 400, y: 580 }, "Fit paper bottom-right is fully visible");

assert.equal(drawing.DRAWING_CAMERA_MIN_ZOOM, 1, "minimum zoom is Fit");
assert.equal(drawing.DRAWING_CAMERA_MAX_ZOOM, 4, "maximum zoom is 4x");
assert.deepEqual(drawing.resolveDrawingTwoTouchCentroid([touch(10, 20), touch(30, 60)]), { x: 20, y: 40 }, "two-touch local centroid is deterministic");
assert.equal(drawing.resolveDrawingTwoTouchDistance([touch(10, 20), touch(40, 60)]), 50, "two-touch page distance is Euclidean");
assert.equal(drawing.resolveDrawingTwoTouchCentroid([touch(1, 1)]), null, "one touch cannot form a camera gesture");
assert.equal(drawing.resolveDrawingTwoTouchDistance([touch(1, 1)]), null, "one touch has no pinch distance");
assert.equal(drawing.beginDrawingCameraGesture({ camera: fitCamera, touches: [touch(10, 10), touch(10, 10)], viewport, viewportGeneration: 1 }), null, "degenerate distance is ignored safely");

const baseTouches = Object.freeze([touch(100, 200), touch(200, 200)]);
const gesture = drawing.beginDrawingCameraGesture({ camera: fitCamera, touches: baseTouches, viewport, viewportGeneration: 7 });
assert.ok(gesture, "valid two-touch gesture begins");
assert.equal(gesture.basePageDistance, 100, "base page distance is captured");
assert.deepEqual(gesture.baseLocalCentroid, { x: 150, y: 200 }, "base local centroid is captured");
assert.deepEqual(gesture.anchorWorld, drawing.screenToWorld(gesture.baseLocalCentroid, fitCamera, viewport), "WORLD focal anchor is captured from canonical inverse");

const zoomTouches = Object.freeze([touch(100, 200), touch(300, 200)]);
const zoomed = drawing.resolveDrawingCameraGesture({ gesture, touches: zoomTouches, viewport, viewportGeneration: 7 });
assert.ok(zoomed, "current touches resolve camera");
near(zoomed.zoom, 2, "pinch distance ratio drives zoom");
const zoomCentroid = drawing.resolveDrawingTwoTouchCentroid(zoomTouches);
const anchoredScreen = drawing.worldToScreen(gesture.anchorWorld, zoomed, viewport);
near(anchoredScreen.x, zoomCentroid.x, "off-center focal WORLD x stays below fingers");
near(anchoredScreen.y, zoomCentroid.y, "off-center focal WORLD y stays below fingers");
assert.notEqual(zoomed.centerX, fitCamera.centerX, "off-center pinch does not zoom around screen center");

const translatedTouches = Object.freeze([touch(140, 230), touch(340, 230)]);
const panned = drawing.resolveDrawingCameraGesture({ gesture, touches: translatedTouches, viewport, viewportGeneration: 7 });
assert.ok(panned, "same gesture supports centroid translation");
assert.notEqual(panned.centerX, zoomed.centerX, "two-finger centroid translation pans x");
assert.notEqual(panned.centerY, zoomed.centerY, "two-finger centroid translation pans y");
const translatedCentroid = drawing.resolveDrawingTwoTouchCentroid(translatedTouches);
const translatedAnchor = drawing.worldToScreen(gesture.anchorWorld, panned, viewport);
near(translatedAnchor.x, translatedCentroid.x, "pan keeps focal x under moving centroid");
near(translatedAnchor.y, translatedCentroid.y, "pan keeps focal y under moving centroid");

const zoomMinimum = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch(145, 200), touch(155, 200)], viewport, viewportGeneration: 7 });
assert.equal(zoomMinimum.zoom, 1, "pinch cannot shrink below Fit");
const zoomMaximum = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch(-100, 200), touch(500, 200)], viewport, viewportGeneration: 7 });
assert.equal(zoomMaximum.zoom, 4, "pinch cannot exceed 4x");
assert.equal(drawing.resolveDrawingCameraGesture({ gesture, touches: zoomTouches, viewport, viewportGeneration: 8 }), null, "stale viewport generation cannot move camera");

const wideViewport = Object.freeze({ width: 1000, height: 500 });
const wideClamped = drawing.clampDrawingCamera({ centerX: 50, centerY: 50, zoom: 2 }, wideViewport);
assert.equal(wideClamped.centerX, 500, "paper-smaller horizontal axis stays centered");
const tallClamped = drawing.clampDrawingCamera({ centerX: -500, centerY: 5000, zoom: 4 }, viewport);
const tallScale = drawing.resolveDrawingViewportTransform(tallClamped, viewport).scale;
const visibleWidth = viewport.width / tallScale;
const visibleHeight = viewport.height / tallScale;
near(tallClamped.centerX, visibleWidth / 2, "paper-larger x clamps to left edge");
near(tallClamped.centerY, 1400 - visibleHeight / 2, "paper-larger y clamps to bottom edge");
assert.deepEqual(drawing.clampDrawingCamera({ centerX: 999, centerY: 1, zoom: 0.1 }, viewport), fitCamera, "camera zoom and center clamp back to Fit");

for (const inside of [{ x: 0, y: 0 }, { x: 1000, y: 1400 }, { x: 500, y: 700 }]) {
  assert.equal(drawing.isDrawingWorldPointInsideCanvas(inside), true, "WORLD boundary and interior are authorable");
}
for (const outside of [{ x: -0.01, y: 0 }, { x: 1000.01, y: 2 }, { x: 4, y: 1400.01 }]) {
  assert.equal(drawing.isDrawingWorldPointInsideCanvas(outside), false, "raw outside-paper point is rejected before clamp");
}

assert.match(editor, /const \[camera, setCamera\] = useState<DrawingCamera>\(createDrawingCamera\)/u, "Product Sketch activates canonical camera as transient state");
assert.match(editor, /const cameraRef = useRef\(camera\)/u, "native callbacks read current camera ref");
assert.match(editor, /initialCoverPendingRef\.current = true[\s\S]*createDrawingCamera\(\)[\s\S]*applyInitialCoverIfPending/u, "fresh editor opening enters the superseding one-shot Cover lifecycle while canonical Fit remains the safe pre-measurement camera");
assert.match(editor, /resolveDrawingViewportTransform\(camera, viewport\)/u, "renderer uses existing camera transform owner");
assert.match(editor, /worldToScreen\(\{ x: 0, y: 0 \}, camera, viewport\)[\s\S]*DRAWING_CANONICAL_CANVAS\.width[\s\S]*DRAWING_CANONICAL_CANVAS\.height/u, "paper rect derives from canonical WORLD corners and current camera");
assert.match(editor, /style=\{\[styles\.canvasSurface, paperScreenRect\]\}/u, "white paper uses projected rect");
assert.match(editor, /pointerEvents="none"[\s\S]*testID="work-order-sketch-canvas"/u, "paper backdrop cannot steal gestures");
assert.match(editor, /onLayout=\{onWorkbenchLayout\}[\s\S]*testID="work-order-sketch-canvas-stage"[\s\S]*\{\.\.\.panResponder\.panHandlers\}/u, "full middle workbench owns renderer/input viewport");
assert.match(editor, /canvasStage: \{[^}]*flex: 1[^}]*overflow: "hidden"/u, "middle workbench flexes and clips remaining area");
assert.match(editor, /canvasRenderer: \{ \.\.\.StyleSheet\.absoluteFillObject \}/u, "renderer fills workbench rather than paper View");
assert.doesNotMatch(editor, /<ScrollView|work-order-sketch-workspace-scroll/u, "outer scroll cannot steal workbench gestures");
assert.ok(editor.indexOf('style={styles.header}') < editor.indexOf('testID="work-order-sketch-canvas-stage"'), "top header is fixed before workbench");
assert.ok(editor.indexOf('testID="work-order-sketch-compact-toolbar"') < editor.indexOf('testID="work-order-sketch-canvas-stage"'), "seven-control toolbar is fixed before workbench");
assert.ok(editor.indexOf('testID="work-order-sketch-footer"') > editor.indexOf('testID="work-order-sketch-canvas-stage"'), "status/actions stay fixed after workbench");

assert.match(editor, /rawWorldPointFromEvent[\s\S]*isDrawingWorldPointInsideCanvas\(rawPoint\)[\s\S]*clampDrawingPointToCanvas\(rawPoint\)/u, "one-finger start checks raw WORLD point before edge clamp");
assert.match(editor, /if \(toolRef\.current === "selection"\) clearSelection\(\)/u, "outside-paper Selection tap may clear selection only");
assert.match(editor, /onTouchStart=\{handleRawCameraTouchStart\}/u, "second-finger raw touch-down transitions to Camera owner");
assert.match(editor, /transition\.cancelOneFingerTransient[\s\S]*discardActiveGesture\(\)[\s\S]*transition\.acquireCamera\) beginRawCameraGesture/u, "raw Camera acquisition cancels all one-finger transient owners before Camera begin");
assert.match(editor, /function updateRawCameraGesture[\s\S]*resolveDrawingCameraGestureUpdate/u, "raw move retains canonical Camera resolution");
assert.match(editor, /suppressOneFingerUntilReleaseRef\.current = transition\.nextState\.suppressionActive/u, "raw Camera lifecycle suppresses remaining one-finger continuation");
assert.match(editor, /cameraInputActiveRef\.current[\s\S]*suppressOneFingerUntilReleaseRef\.current[\s\S]*\) return;/u, "camera/remaining-finger PanResponder callbacks cannot author Scene");
assert.match(editor, /handleRawCameraTouchEnd[\s\S]*handleRawCameraTouch\("end", event\)/u, "raw touch end retains suppression until full release before fresh authoring");
assert.match(editor, /viewportGenerationRef\.current \+= 1[\s\S]*cancelAllTransientGestures\(\)[\s\S]*clampDrawingCamera/u, "viewport change invalidates gestures and clamps without Fit reset");

assert.match(editor, /function undo\(\)[\s\S]*undoDrawingScene/u, "Undo remains Scene-only");
assert.match(editor, /function redo\(\)[\s\S]*redoDrawingScene/u, "Redo remains Scene-only");
assert.match(editor, /savePrimaryWorkOrderDrawing\([^)]*scene: submitted/u, "Save payload remains Scene-only");
assert.doesNotMatch(scenePolicy, /DrawingCamera|centerX|centerY|zoom/u, "camera is absent from Scene serialization/history owner");
assert.doesNotMatch(api, /DrawingCamera|centerX|centerY|zoom/u, "camera is absent from Drawing API payload");
assert.doesNotMatch(contracts.match(/export type DrawingSceneV1[\s\S]*?\};/u)?.[0] ?? "", /camera|zoom|centerX|centerY/u, "camera is absent from Scene v1 contract");
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u, "Scene schema remains v1");
assert.match(contracts, /width: 1_000[\s\S]*height: 1_400/u, "WORLD remains 1000x1400 A4-like paper");
assert.doesNotMatch(cameraPolicy, /\b(?:react|react-native|expo|iPhone|iPad|device|Platform)\b/iu, "camera gesture owner is pure and device-independent");
assert.match(viewportPolicy, /fitScale = Math\.min\(/u, "existing canonical viewport transform remains sole owner");
for (const forbidden of ["확대", "축소", "캔버스 이동", "크기 조절", "회전", "끝점 편집"]) {
  assert.doesNotMatch(editor, new RegExp(`accessibilityLabel="${forbidden}"`, "u"), `${forbidden} control is absent`);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-fit-paper-pinch-zoom-pan",
  previousPermanentInventoryRetained: 281,
  addedPermanentChecks: 1,
  finalPermanentInventory: 282,
  assertionsMinimum: 70,
  zoom: "1..4",
  world: "1000x1400",
  sceneSchemaVersion: 1,
  sceneApiSchemaMigrationDelta: "0/0/0/0",
  dependencyNativeConfigEasDelta: "0/0/0/0",
  physicalResultInferred: false,
  freshOpenPresentationSupersededBy: "workorder-v2-alpha76-initial-cover-pinch-reliability",
}));

#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-native-pinch-"));
try {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc",
    "--module", "commonjs",
    "--moduleResolution", "node",
    "--target", "ES2020",
    "--strict",
    "--skipLibCheck",
    "--rootDir", ".",
    "--outDir", compiledDirectory,
    ...fs.readdirSync("lib/domain/drawing").filter((name) => name.endsWith(".ts")).map((name) => `lib/domain/drawing/${name}`),
    "apps/mobile/features/work-orders/drawing/drawingCameraFrameCoalescing.ts",
  ], { cwd: process.cwd(), stdio: "pipe" });
} catch (error) {
  fs.rmSync(compiledDirectory, { recursive: true, force: true });
  throw error;
}
process.on("exit", () => fs.rmSync(compiledDirectory, { recursive: true, force: true }));

const require = createRequire(import.meta.url);
const drawing = require(path.join(compiledDirectory, "lib/domain/drawing/index.js"));
const { createDrawingLatestFrameScheduler } = require(path.join(compiledDirectory, "apps/mobile/features/work-orders/drawing/drawingCameraFrameCoalescing.js"));
const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const cameraPolicy = read("lib/domain/drawing/cameraGesture.ts");
const scenePolicy = read("lib/domain/drawing/scene.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const api = read("apps/mobile/lib/api/drawingApi.ts");
const packageJson = read("package.json") + read("apps/mobile/package.json");
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} ~= ${expected}`);
const touch = (identifier, localX, localY, pageX, pageY) => Object.freeze({ identifier, localX, localY, pageX, pageY });
const viewport = Object.freeze({ width: 400, height: 800 });
const baseCamera = drawing.createDrawingCoverCamera(viewport);
const baseTouches = Object.freeze([
  touch("a", 100, 300, 500, 700),
  touch("b", 200, 300, 600, 700),
]);
const gesture = drawing.beginDrawingCameraGesture({ camera: baseCamera, touches: baseTouches, viewport, viewportGeneration: 9 });
assert.ok(gesture);
assert.deepEqual(gesture.touchIdentifiers, ["a", "b"]);
assert.deepEqual(gesture.baseLocalCentroid, { x: 150, y: 300 });
assert.deepEqual(gesture.basePageCentroid, { x: 550, y: 700 });
assert.equal(gesture.basePageDistance, 100);
assert.deepEqual(gesture.anchorWorld, drawing.screenToWorld({ x: 150, y: 300 }, baseCamera, viewport));

const pageSpreadWithUnstableLocal = Object.freeze([
  touch("a", 150, 350, 499, 700),
  touch("b", 250, 350, 601, 700),
]);
const spread = drawing.resolveDrawingCameraGesture({ gesture, touches: pageSpreadWithUnstableLocal, viewport, viewportGeneration: 9 });
near(spread.zoom, baseCamera.zoom * 1.02, "page distance, not moving local coordinates, owns zoom");
const reconstructedCentroid = { x: 150, y: 300 };
const reconstructedAnchorScreen = drawing.worldToScreen(gesture.anchorWorld, spread, viewport);
near(reconstructedAnchorScreen.x, reconstructedCentroid.x, "local focal x is reconstructed from page delta");
near(reconstructedAnchorScreen.y, reconstructedCentroid.y, "local focal y is reconstructed from page delta");

const shiftedOriginGesture = drawing.beginDrawingCameraGesture({
  camera: baseCamera,
  touches: [touch("a", 100, 300, 1500, 1700), touch("b", 200, 300, 1600, 1700)],
  viewport,
  viewportGeneration: 9,
});
const shiftedOriginSpread = drawing.resolveDrawingCameraGesture({
  gesture: shiftedOriginGesture,
  touches: [touch("a", 999, 999, 1499, 1700), touch("b", -999, -999, 1601, 1700)],
  viewport,
  viewportGeneration: 9,
});
near(shiftedOriginSpread.zoom, spread.zoom, "absolute page origin translation preserves pinch ratio");
near(shiftedOriginSpread.centerX, spread.centerX, "local-coordinate instability after acquisition cannot move focal x");
near(shiftedOriginSpread.centerY, spread.centerY, "local-coordinate instability after acquisition cannot move focal y");

const stationaryFirst = drawing.resolveDrawingCameraGesture({ gesture, touches: [baseTouches[0], touch("b", 200, 300, 602, 700)], viewport, viewportGeneration: 9 });
near(stationaryFirst.zoom, baseCamera.zoom * 1.02, "stationary first and moving second pinch");
const stationarySecond = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("a", 100, 300, 498, 700), baseTouches[1]], viewport, viewportGeneration: 9 });
near(stationarySecond.zoom, baseCamera.zoom * 1.02, "moving first and stationary second pinch");
const symmetric = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("a", 100, 300, 499, 700), touch("b", 200, 300, 601, 700)], viewport, viewportGeneration: 9 });
near(symmetric.zoom, baseCamera.zoom * 1.02, "symmetric small spread pinch");
const inward = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("a", 100, 300, 501, 700), touch("b", 200, 300, 599, 700)], viewport, viewportGeneration: 9 });
near(inward.zoom, baseCamera.zoom * 0.98, "small inward pinch is proportional");
const translated = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("a", 100, 300, 520, 712), touch("b", 200, 300, 620, 712)], viewport, viewportGeneration: 9 });
near(translated.zoom, baseCamera.zoom, "equal page translation does not change zoom");
const translatedAnchor = drawing.worldToScreen(gesture.anchorWorld, translated, viewport);
near(translatedAnchor.x, 170, "page centroid translation pans focal x");
near(translatedAnchor.y, 300, "Cover-constrained paper axis remains safely clamped while the free axis pans");
const reordered = drawing.resolveDrawingCameraGesture({ gesture, touches: [pageSpreadWithUnstableLocal[1], pageSpreadWithUnstableLocal[0]], viewport, viewportGeneration: 9 });
near(reordered.zoom, spread.zoom, "native touch array reorder is stable");
const thirdTouch = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("c", 0, 0, 20, 20), pageSpreadWithUnstableLocal[1], pageSpreadWithUnstableLocal[0]], viewport, viewportGeneration: 9 });
near(thirdTouch.zoom, spread.zoom, "third touch cannot replace stable pair");
assert.equal(drawing.resolveDrawingCameraGesture({ gesture, touches: [baseTouches[0], touch("c", 0, 0, 20, 20)], viewport, viewportGeneration: 9 }), null);
assert.equal(drawing.resolveDrawingCameraGesture({ gesture, touches: baseTouches, viewport, viewportGeneration: 10 }), null);

let incremental = null;
for (let amount = 1; amount <= 20; amount += 1) {
  incremental = drawing.resolveDrawingCameraGesture({
    gesture,
    touches: [touch("a", 100, 300, 500 - amount / 2, 700), touch("b", 200, 300, 600 + amount / 2, 700)],
    viewport,
    viewportGeneration: 9,
  });
}
near(incremental.zoom, baseCamera.zoom * 1.2, "many 1px increments remain visible instead of being discarded");
assert.ok(spread.zoom > baseCamera.zoom);
assert.ok(inward.zoom < baseCamera.zoom);
assert.ok(incremental.zoom > spread.zoom);

const rebased = drawing.beginDrawingCameraGesture({
  camera: incremental,
  touches: [touch("a", 100, 300, 490, 700), touch("c", 200, 300, 610, 700)],
  viewport,
  viewportGeneration: 9,
});
const rebasedFirstFrame = drawing.resolveDrawingCameraGesture({ gesture: rebased, touches: [touch("c", -20, -20, 610, 700), touch("a", 900, 900, 490, 700)], viewport, viewportGeneration: 9 });
near(rebasedFirstFrame.zoom, incremental.zoom, "pair change rebases from current camera without zoom jump");
near(rebasedFirstFrame.centerX, incremental.centerX, "pair change rebases without x jump");
near(rebasedFirstFrame.centerY, incremental.centerY, "pair change rebases without y jump");
assert.throws(() => drawing.resolveDrawingTwoTouchDistance([touch("a", 0, 0, Number.NaN, 0), touch("b", 1, 1, 1, 1)]), /finite/u);

let nextFrameHandle = 0;
const frames = new Map();
const cancelled = [];
const renders = [];
const scheduler = createDrawingLatestFrameScheduler({
  cancelFrame: (handle) => { cancelled.push(handle); frames.delete(handle); },
  render: (value) => renders.push(value),
  requestFrame: (callback) => { const handle = nextFrameHandle += 1; frames.set(handle, callback); return handle; },
});
scheduler.schedule("camera-1");
assert.equal(frames.size, 1, "first camera sample schedules one RAF");
scheduler.schedule("camera-2");
scheduler.schedule("camera-3");
assert.equal(frames.size, 1, "multiple native updates retain at most one RAF");
assert.equal(renders.length, 0, "render waits for display frame");
frames.get(1)();
assert.deepEqual(renders, ["camera-3"], "latest camera wins inside one display frame");
assert.equal(frames.size, 1, "executed test callback remains in fake map until test bookkeeping removes it");
frames.delete(1);
scheduler.schedule("camera-4");
scheduler.schedule("camera-5");
scheduler.flush();
assert.deepEqual(renders, ["camera-3", "camera-5"], "gesture end flush preserves latest camera");
assert.ok(cancelled.includes(2), "flush cancels obsolete pending frame");
scheduler.schedule("stale-reset-camera");
scheduler.cancel();
assert.equal(frames.size, 0, "authoritative reset cancels stale pending RAF");
assert.deepEqual(renders, ["camera-3", "camera-5"]);
scheduler.schedule("stale-unmount-camera");
scheduler.dispose();
assert.equal(frames.size, 0, "unmount disposal cancels pending RAF");
scheduler.schedule("ignored-after-dispose");
assert.equal(frames.size, 0, "disposed scheduler cannot resurrect a frame");

assert.match(editor, /identifier: touch\.identifier[\s\S]*localX: touch\.locationX[\s\S]*localY: touch\.locationY[\s\S]*pageX: touch\.pageX[\s\S]*pageY: touch\.pageY/u);
assert.match(editor, /event\.nativeEvent\.touches\.map/u, "RN active touches provide current members; no duplicate changedTouches map is required");
assert.match(editor, /projectCurrentCamera = useCallback[\s\S]*cameraRef\.current = next[\s\S]*cameraFrameScheduler\.schedule\(next\)/u, "every valid native sample advances authoritative camera ref before coalesced render");
assert.match(editor, /projectCurrentCamera\(update\.camera\)[\s\S]*cameraGestureRef\.current = update\.gesture/u, "boundary rebase advances the camera and gesture baseline from the same native sample");
assert.match(editor, /function endCameraGesture[\s\S]*cameraFrameScheduler\.flush\(\)/u);
assert.match(editor, /setCurrentCamera = useCallback[\s\S]*cameraFrameScheduler\.cancel\(\)[\s\S]*cameraRef\.current = next/u, "hard reset cancels stale presentation before applying authoritative camera");
assert.match(editor, /viewportGenerationRef\.current \+= 1;[\s\S]*cancelAllTransientGestures\(\)/u);
assert.match(editor, /useEffect\(\(\) => \(\) => cameraFrameScheduler\.cancel\(\)/u, "unmount cleanup cancels a pending presentation frame without permanently disposing a StrictMode-reused scheduler instance");
assert.match(editor, /createDrawingCoverCamera/u);
assert.match(editor, /onTouchStart=\{handleRawCameraTouchStart\}/u, "raw workbench touch start supersedes PanResponder acquisition");
assert.match(editor, /onTouchMove=\{handleRawCameraTouchMove\}/u, "raw workbench touch move supersedes PanResponder Camera updates");
assert.match(editor, /selectionBeforeOneFingerGestureRef\.current[\s\S]*selectElement\(selectionBeforeOneFingerGestureRef\.current\)/u);
assert.match(editor, /transition\.cancelOneFingerTransient[\s\S]*discardActiveGesture\(\)[\s\S]*cameraInputActiveRef\.current = transition\.nextState\.cameraActive/u);
assert.match(editor, /suppressOneFingerUntilReleaseRef\.current = transition\.nextState\.suppressionActive/u);
assert.match(editor, /cameraInputActiveRef\.current \|\| suppressOneFingerUntilReleaseRef\.current/u);
assert.match(editor, /worldPointFromEvent[\s\S]*cameraRef\.current/u, "one-finger authoring reads latest coalesced camera math");
assert.doesNotMatch(scenePolicy + api, /DrawingCamera|basePageDistance|cameraFrameScheduler/u, "camera remains transient and outside Scene/API persistence");
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.match(contracts, /width: 1_000[\s\S]*height: 1_400/u);
assert.doesNotMatch(cameraPolicy, /Math\.pow|sensitivity|dead.?zone|snapZoom/iu);
assert.match(cameraPolicy, /input\.baseZoom \* input\.currentPageDistance \/ input\.basePageDistance/u, "zoom ratio remains exact 1:1 in the canonical pure zoom-sample owner");
assert.doesNotMatch(cameraPolicy, /from\s+["'](?:react|react-native|expo)|\bPlatform\b|devicePixelRatio/iu);
assert.doesNotMatch(packageJson, /react-native-gesture-handler|react-native-reanimated|react-native-worklets/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-native-pinch-tracking-frame-coalescing",
  previousPermanentInventoryRetained: 283,
  addedPermanentChecks: 1,
  finalPermanentInventory: 284,
  assertionsMinimum: 62,
  touchGeometry: "stable-page-pair-with-local-acquisition-anchor",
  renderProjection: "latest-camera-at-most-once-per-raf",
  changedTouchesMap: "not-required-nativeEvent-touches-is-current-active-set",
  sceneApiSchemaMigrationDelta: "0/0/0/0",
  dependencyNativeConfigEasDelta: "0/0/0/0",
  physicalResultInferred: false,
}));

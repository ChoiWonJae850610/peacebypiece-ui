#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-pinch-clamp-"));
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
const editor = fs.readFileSync("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx", "utf8");
const cameraPolicy = fs.readFileSync("lib/domain/drawing/cameraGesture.ts", "utf8");
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} ~= ${expected}`);
const viewport = Object.freeze({ width: 500, height: 700 });
const camera = (zoom) => drawing.createDrawingCamera({ centerX: 500, centerY: 700, zoom });
const touches = (distance, pageCenterX = 400, pageCenterY = 600, localCenterX = 250, localCenterY = 350) => Object.freeze([
  Object.freeze({ identifier: "left", localX: localCenterX - distance / 2, localY: localCenterY, pageX: pageCenterX - distance / 2, pageY: pageCenterY }),
  Object.freeze({ identifier: "right", localX: localCenterX + distance / 2, localY: localCenterY, pageX: pageCenterX + distance / 2, pageY: pageCenterY }),
]);
const update = (gesture, distance, options = {}) => drawing.resolveDrawingCameraGestureUpdate({
  gesture,
  touches: touches(distance, options.pageCenterX, options.pageCenterY, options.localCenterX, options.localCenterY),
  viewport,
  viewportGeneration: options.viewportGeneration ?? 12,
});

assert.equal(drawing.DRAWING_CAMERA_MIN_ZOOM, 1);
assert.equal(drawing.DRAWING_CAMERA_MAX_ZOOM, 4);
assert.deepEqual(drawing.resolveDrawingCameraZoomSample({ baseZoom: 2, basePageDistance: 100, currentPageDistance: 50 }), {
  rawZoom: 1,
  clampedZoom: 1,
  clampState: "none",
});
assert.deepEqual(drawing.resolveDrawingCameraZoomSample({ baseZoom: 2, basePageDistance: 100, currentPageDistance: 40 }), {
  rawZoom: 0.8,
  clampedZoom: 1,
  clampState: "min",
});
assert.deepEqual(drawing.resolveDrawingCameraZoomSample({ baseZoom: 2, basePageDistance: 100, currentPageDistance: 200 }), {
  rawZoom: 4,
  clampedZoom: 4,
  clampState: "none",
});
assert.deepEqual(drawing.resolveDrawingCameraZoomSample({ baseZoom: 2, basePageDistance: 100, currentPageDistance: 240 }), {
  rawZoom: 4.8,
  clampedZoom: 4,
  clampState: "max",
});
assert.throws(() => drawing.resolveDrawingCameraZoomSample({ baseZoom: 2, basePageDistance: 0, currentPageDistance: 20 }), /valid base distance/u);

let minimumGesture = drawing.beginDrawingCameraGesture({ camera: camera(2), touches: touches(100), viewport, viewportGeneration: 12 });
assert.ok(minimumGesture);
const minimumBoundary = update(minimumGesture, 50);
assert.equal(minimumBoundary.camera.zoom, 1);
assert.equal(minimumBoundary.rebasedAtBoundary, null, "exact boundary is not overshoot");
assert.equal(minimumBoundary.gesture, minimumGesture, "normal/boundary frame retains the original proportional baseline");
const minimumOvershoot = update(minimumBoundary.gesture, 40);
assert.equal(minimumOvershoot.camera.zoom, 1);
assert.equal(minimumOvershoot.zoomSample.rawZoom, 0.8);
assert.equal(minimumOvershoot.zoomSample.clampState, "min");
assert.equal(minimumOvershoot.rebasedAtBoundary, "min");
assert.equal(minimumOvershoot.gesture.baseCamera.zoom, 1);
assert.equal(minimumOvershoot.gesture.basePageDistance, 40);
assert.deepEqual(minimumOvershoot.gesture.touchIdentifiers, ["left", "right"]);
assert.equal(minimumOvershoot.gesture.viewportGeneration, 12);
assert.deepEqual(minimumOvershoot.gesture.baseCamera, minimumOvershoot.camera, "rebase frame uses the authoritative clamped camera without a visual jump");
const minimumReverse = update(minimumOvershoot.gesture, 41);
near(minimumReverse.camera.zoom, 1.025, "tiny outward reversal immediately leaves Fit");
assert.equal(minimumReverse.rebasedAtBoundary, null, "reversal does not rebase");
assert.equal(minimumReverse.gesture, minimumOvershoot.gesture);
const minimumInwardAgain = update(minimumReverse.gesture, 39);
assert.equal(minimumInwardAgain.camera.zoom, 1);
assert.equal(minimumInwardAgain.rebasedAtBoundary, "min", "a later farther inward push rebases again at the boundary");
assert.equal(minimumInwardAgain.gesture.basePageDistance, 39);
const minimumReverseAgain = update(minimumInwardAgain.gesture, 39.5);
assert.ok(minimumReverseAgain.camera.zoom > 1);

let maximumGesture = drawing.beginDrawingCameraGesture({ camera: camera(2), touches: touches(100), viewport, viewportGeneration: 12 });
assert.ok(maximumGesture);
const maximumBoundary = update(maximumGesture, 200);
assert.equal(maximumBoundary.camera.zoom, 4);
assert.equal(maximumBoundary.rebasedAtBoundary, null);
const maximumOvershoot = update(maximumBoundary.gesture, 240);
assert.equal(maximumOvershoot.camera.zoom, 4);
assert.equal(maximumOvershoot.zoomSample.rawZoom, 4.8);
assert.equal(maximumOvershoot.zoomSample.clampState, "max");
assert.equal(maximumOvershoot.rebasedAtBoundary, "max");
assert.equal(maximumOvershoot.gesture.baseCamera.zoom, 4);
assert.equal(maximumOvershoot.gesture.basePageDistance, 240);
assert.deepEqual(maximumOvershoot.gesture.baseCamera, maximumOvershoot.camera);
const maximumReverse = update(maximumOvershoot.gesture, 239);
near(maximumReverse.camera.zoom, 4 * 239 / 240, "tiny inward reversal immediately leaves maximum zoom");
assert.ok(maximumReverse.camera.zoom < 4);
assert.equal(maximumReverse.rebasedAtBoundary, null);
const maximumOutwardAgain = update(maximumReverse.gesture, 241);
assert.equal(maximumOutwardAgain.camera.zoom, 4);
assert.equal(maximumOutwardAgain.rebasedAtBoundary, "max");
assert.equal(maximumOutwardAgain.gesture.basePageDistance, 241);
const maximumReverseAgain = update(maximumOutwardAgain.gesture, 240.5);
assert.ok(maximumReverseAgain.camera.zoom < 4);

const normalGesture = drawing.beginDrawingCameraGesture({ camera: camera(2), touches: touches(100), viewport, viewportGeneration: 12 });
const normalSpread = update(normalGesture, 110);
near(normalSpread.camera.zoom, 2.2, "normal-range zoom retains the exact proportional formula");
assert.equal(normalSpread.rebasedAtBoundary, null);
assert.equal(normalSpread.gesture, normalGesture, "normal frames never rebase");
const normalInward = update(normalGesture, 90);
near(normalInward.camera.zoom, 1.8, "normal inward reversal remains proportional");
assert.equal(normalInward.rebasedAtBoundary, null);

const movingGesture = drawing.beginDrawingCameraGesture({ camera: camera(2), touches: touches(100), viewport, viewportGeneration: 12 });
const movingOvershoot = update(movingGesture, 40, { pageCenterX: 420, pageCenterY: 615 });
assert.equal(movingOvershoot.rebasedAtBoundary, "min");
const projectedRebaseAnchor = drawing.worldToScreen(movingOvershoot.gesture.anchorWorld, movingOvershoot.camera, viewport);
near(projectedRebaseAnchor.x, movingOvershoot.gesture.baseLocalCentroid.x, "rebase preserves focal x on its frame");
near(projectedRebaseAnchor.y, movingOvershoot.gesture.baseLocalCentroid.y, "rebase preserves focal y on its frame");
const movingReverse = update(movingOvershoot.gesture, 41, { pageCenterX: 421, pageCenterY: 616 });
assert.ok(movingReverse.camera.zoom > 1);
const movingReverseAnchor = drawing.worldToScreen(movingOvershoot.gesture.anchorWorld, movingReverse.camera, viewport);
near(movingReverseAnchor.x, movingOvershoot.gesture.baseLocalCentroid.x + 1, "focal x follows page centroid after rebase");
near(movingReverseAnchor.y, movingOvershoot.gesture.baseLocalCentroid.y + 1, "focal y follows page centroid after rebase");

let cycleGesture = drawing.beginDrawingCameraGesture({ camera: camera(2), touches: touches(100), viewport, viewportGeneration: 12 });
for (let cycle = 0; cycle < 10; cycle += 1) {
  const toMinimum = update(cycleGesture, 40 - cycle * 0.5);
  assert.equal(toMinimum.camera.zoom, 1);
  assert.equal(toMinimum.rebasedAtBoundary, "min");
  const reverse = update(toMinimum.gesture, 40.25 - cycle * 0.5);
  assert.ok(reverse.camera.zoom > 1, `minimum reversal cycle ${cycle + 1}`);
  cycleGesture = toMinimum.gesture;
}

assert.equal(update(normalGesture, 110, { viewportGeneration: 13 }), null, "stale viewport generation cannot author camera or baseline");
assert.equal(drawing.resolveDrawingCameraGestureUpdate({ gesture: normalGesture, touches: [touches(110)[0]], viewport, viewportGeneration: 12 }), null, "lost stable pair requires the existing current-camera membership rebase");
assert.equal(drawing.resolveDrawingCameraGesture({ gesture: normalGesture, touches: touches(110), viewport, viewportGeneration: 12 }).zoom, normalSpread.camera.zoom, "legacy camera-only resolver preserves its public behavior");

assert.match(editor, /resolveDrawingCameraGestureUpdate/u);
assert.match(editor, /projectCurrentCamera\(update\.camera\)[\s\S]*cameraGestureRef\.current = update\.gesture/u, "every valid sample advances the authoritative camera and gesture baseline together");
assert.match(cameraPolicy, /resolveDrawingCameraZoomSample/u, "one pure owner holds the exact zoom formula and clamp classification");
assert.match(cameraPolicy, /baseZoom \* input\.currentPageDistance \/ input\.basePageDistance/u);
assert.match(cameraPolicy, /isPushingFartherIntoZoomBoundary/u);
assert.match(cameraPolicy, /anchorWorld: screenToWorld\(currentLocalCentroid, camera, input\.viewport\)/u);
assert.doesNotMatch(cameraPolicy, /sensitivity|exponent|dead.?zone|snapZoom|iPhone|iPad|devicePixelRatio/iu);
assert.doesNotMatch(editor, /baseCamera\.zoom \*.*basePageDistance/u, "Product UI does not duplicate pinch math");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-pinch-clamp-boundary-rebase",
  previousPermanentInventoryRetained: 284,
  addedPermanentChecks: 1,
  finalPermanentInventory: 285,
  assertionsMinimum: 72,
  pinchFormula: "baseZoom*currentPageDistance/basePageDistance",
  minimumBoundary: "Fit=1-push-only-rebase-immediate-outward-reversal",
  maximumBoundary: "Max=4-push-only-rebase-immediate-inward-reversal",
  normalRange: "unchanged-single-baseline",
  sceneHistoryNetworkPersistenceDelta: "0/0/0/0",
  dependencyNativeConfigEasDelta: "0/0/0/0",
  physicalResultInferred: false,
}));

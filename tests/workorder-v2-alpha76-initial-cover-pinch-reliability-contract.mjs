#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-cover-pinch-"));
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
const contracts = read("lib/domain/drawing/contracts.ts");
const scenePolicy = read("lib/domain/drawing/scene.ts");
const api = read("apps/mobile/lib/api/drawingApi.ts");
const packageJson = read("package.json");
const mobilePackageJson = read("apps/mobile/package.json");
const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} ~= ${expected}`);
const touch = (identifier, localX, localY, pageX = localX + 40, pageY = localY + 80) => Object.freeze({ identifier, localX, localY, pageX, pageY });

const fit = drawing.createDrawingCamera();
assert.deepEqual(fit, { centerX: 500, centerY: 700, zoom: 1 }, "canonical createDrawingCamera remains Fit");
assert.equal(drawing.DRAWING_CAMERA_MIN_ZOOM, 1);
assert.equal(drawing.DRAWING_CAMERA_MAX_ZOOM, 4);

const exactViewport = Object.freeze({ width: 500, height: 700 });
assert.deepEqual(drawing.createDrawingCoverCamera(exactViewport), fit, "matching 5:7 viewport has Cover=Fit");
const portraitViewport = Object.freeze({ width: 400, height: 800 });
const portraitCover = drawing.createDrawingCoverCamera(portraitViewport);
near(portraitCover.zoom, (800 / 1400) / (400 / 1000), "Cover uses max scale divided by min scale");
assert.ok(portraitCover.zoom > 1, "tall portrait Cover exceeds Fit");
assert.deepEqual({ x: portraitCover.centerX, y: portraitCover.centerY }, { x: 500, y: 700 }, "Cover is WORLD-centered");
const portraitTransform = drawing.resolveDrawingViewportTransform(portraitCover, portraitViewport);
near(portraitTransform.scale * 1400, portraitViewport.height, "Cover fills portrait height");
assert.ok(portraitTransform.scale * 1000 >= portraitViewport.width, "Cover fills portrait width");
assert.equal(portraitTransform.scale, portraitTransform.fitScale * portraitCover.zoom, "one uniform scale owns both axes");
const wideCover = drawing.createDrawingCoverCamera({ width: 800, height: 400 });
near(wideCover.zoom, 2.8, "wide Cover follows the same pure formula");
assert.deepEqual(drawing.createDrawingCoverCamera({ width: 0, height: 400 }), fit, "invalid viewport safely retains Fit");
assert.deepEqual(drawing.createDrawingCoverCamera({ width: Number.NaN, height: 400 }), fit, "non-finite viewport safely retains Fit");
assert.equal(drawing.createDrawingCoverCamera({ width: 10_000, height: 1 }).zoom, 4, "Cover obeys maximum zoom clamp");

const baseTouches = Object.freeze([touch("left", 100, 300), touch("right", 200, 300)]);
const gesture = drawing.beginDrawingCameraGesture({ camera: portraitCover, touches: baseTouches, viewport: portraitViewport, viewportGeneration: 4 });
assert.ok(gesture);
assert.deepEqual(gesture.touchIdentifiers, ["left", "right"], "stable native touch identifiers are captured");
const reordered = drawing.resolveDrawingCameraGesture({
  gesture,
  touches: [touch("right", 202, 300), touch("left", 98, 300)],
  viewport: portraitViewport,
  viewportGeneration: 4,
});
assert.ok(reordered, "touch-array order does not break the stable pair");
near(reordered.zoom, portraitCover.zoom * 1.04, "small spread produces a proportional floating zoom-in");
const smallInward = drawing.resolveDrawingCameraGesture({
  gesture,
  touches: [touch("left", 101, 300), touch("right", 199, 300)],
  viewport: portraitViewport,
  viewportGeneration: 4,
});
near(smallInward.zoom, portraitCover.zoom * 0.98, "small inward movement produces immediate zoom-out");
const withThirdTouch = drawing.resolveDrawingCameraGesture({
  gesture,
  touches: [touch("third", 700, 700), touch("right", 210, 300), touch("left", 90, 300)],
  viewport: portraitViewport,
  viewportGeneration: 4,
});
near(withThirdTouch.zoom, portraitCover.zoom * 1.2, "third touch is ignored while the stable pair remains present");
assert.equal(drawing.resolveDrawingCameraGesture({
  gesture,
  touches: [touch("left", 90, 300), touch("third", 700, 700)],
  viewport: portraitViewport,
  viewportGeneration: 4,
}), null, "pair membership loss requests a safe rebase");
const rebased = drawing.beginDrawingCameraGesture({
  camera: withThirdTouch,
  touches: [touch("left", 90, 300), touch("third", 700, 700)],
  viewport: portraitViewport,
  viewportGeneration: 4,
});
assert.ok(rebased, "replacement pair safely rebases from current camera");
const rebasedFirstFrame = drawing.resolveDrawingCameraGesture({ gesture: rebased, touches: [touch("third", 700, 700), touch("left", 90, 300)], viewport: portraitViewport, viewportGeneration: 4 });
near(rebasedFirstFrame.centerX, withThirdTouch.centerX, "rebase first frame preserves camera center x");
near(rebasedFirstFrame.centerY, withThirdTouch.centerY, "rebase first frame preserves camera center y");
near(rebasedFirstFrame.zoom, withThirdTouch.zoom, "rebase first frame has no visual jump or zoom reset");

const spread = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("left", 80, 300), touch("right", 220, 300)], viewport: portraitViewport, viewportGeneration: 4 });
const inward = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("left", 120, 300), touch("right", 180, 300)], viewport: portraitViewport, viewportGeneration: 4 });
const spreadAgain = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("left", 70, 300), touch("right", 230, 300)], viewport: portraitViewport, viewportGeneration: 4 });
assert.ok(spread.zoom > portraitCover.zoom, "spread zooms in");
assert.ok(inward.zoom < portraitCover.zoom, "same gesture reverses inward immediately");
assert.ok(spreadAgain.zoom > spread.zoom, "same gesture reverses outward again");
assert.notEqual(spread.zoom, Math.round(spread.zoom), "zoom is not coarsely rounded");
const minimum = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("left", 149, 300), touch("right", 151, 300)], viewport: portraitViewport, viewportGeneration: 4 });
assert.equal(minimum.zoom, 1, "pinch can move below Cover to Fit minimum");
const maximum = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("left", -500, 300), touch("right", 900, 300)], viewport: portraitViewport, viewportGeneration: 4 });
assert.equal(maximum.zoom, 4, "only maximum clamp stops outward zoom");
const minimumOvershoot = drawing.resolveDrawingCameraGestureUpdate({ gesture, touches: [touch("left", 149, 300), touch("right", 151, 300)], viewport: portraitViewport, viewportGeneration: 4 });
assert.equal(minimumOvershoot.rebasedAtBoundary, "min", "continued inward motion rebases at Fit");
const minimumReverse = drawing.resolveDrawingCameraGestureUpdate({ gesture: minimumOvershoot.gesture, touches: [touch("left", 148.5, 300), touch("right", 151.5, 300)], viewport: portraitViewport, viewportGeneration: 4 });
assert.ok(minimumReverse.camera.zoom > 1, "the first outward reversal leaves Fit without hidden travel");
const maximumOvershoot = drawing.resolveDrawingCameraGestureUpdate({ gesture, touches: [touch("left", -550, 300), touch("right", 950, 300)], viewport: portraitViewport, viewportGeneration: 4 });
assert.equal(maximumOvershoot.rebasedAtBoundary, "max", "continued outward motion rebases at maximum zoom");
const maximumReverse = drawing.resolveDrawingCameraGestureUpdate({ gesture: maximumOvershoot.gesture, touches: [touch("left", -549.5, 300), touch("right", 949.5, 300)], viewport: portraitViewport, viewportGeneration: 4 });
assert.ok(maximumReverse.camera.zoom < 4, "the first inward reversal leaves maximum zoom without hidden travel");
const centroid = drawing.resolveDrawingTwoTouchCentroid([touch("left", 80, 330), touch("right", 220, 330)]);
const focalCamera = drawing.resolveDrawingCameraGesture({ gesture, touches: [touch("left", 80, 330), touch("right", 220, 330)], viewport: portraitViewport, viewportGeneration: 4 });
const anchorScreen = drawing.worldToScreen(gesture.anchorWorld, focalCamera, portraitViewport);
near(anchorScreen.x, centroid.x, "focal WORLD x remains under current centroid");
near(anchorScreen.y, centroid.y, "two-finger centroid Pan remains focal-stable");

assert.match(editor, /initialCoverPendingRef = useRef\(false\)/u);
assert.match(editor, /initialCoverPendingRef\.current = true[\s\S]*applyInitialCoverIfPending\(viewportRef\.current\)/u, "open/reopen arms one-shot Cover and consumes known viewport");
assert.match(editor, /applyInitialCoverIfPending = useCallback[\s\S]*initialCoverPendingRef\.current = false[\s\S]*createDrawingCoverCamera/u, "Cover is consumed exactly once");
assert.match(editor, /if \(!applyInitialCoverIfPending\(next\)\) setCurrentCamera\(clampDrawingCamera/u, "later layouts clamp current camera instead of forcing Cover");
assert.match(editor, /identifier: touch\.identifier/u, "native identifier is preserved by event extraction");
assert.doesNotMatch(editor, /touches\.slice\(0, 2\)/u, "event extraction does not discard membership evidence before stable-pair resolution");
assert.match(editor, /onTouchStart=\{handleRawCameraTouchStart\}/u, "raw second-finger touch-down transfers Camera ownership without movement slop");
assert.match(editor, /selectionBeforeOneFingerGestureRef\.current = selectedElementIdRef\.current/u, "pre-first-finger Selection is captured");
assert.match(editor, /selectedElementIdRef\.current !== selectionBeforeOneFingerGestureRef\.current[\s\S]*selectElement\(selectionBeforeOneFingerGestureRef\.current\)/u, "camera takeover restores provisional Selection side effects");
assert.match(editor, /resolveDrawingCameraGesture[\s\S]*cameraGestureRef\.current = beginDrawingCameraGesture\(\{[\s\S]*camera: cameraRef\.current/u, "pair membership change rebases from current camera");
assert.match(editor, /transition\.cancelOneFingerTransient[\s\S]*discardActiveGesture\(\)[\s\S]*cameraInputActiveRef\.current = transition\.nextState\.cameraActive/u, "second-finger raw acquisition cancels transient authoring before Camera begin");
assert.match(editor, /suppressOneFingerUntilReleaseRef\.current = transition\.nextState\.suppressionActive/u);
assert.match(editor, /handleRawCameraTouchEnd[\s\S]*handleRawCameraTouch\("end", event\)/u, "raw touch end owns Camera end and full-release suppression lifecycle");
assert.match(editor, /function undo\(\)[\s\S]*undoDrawingScene/u);
assert.match(editor, /function redo\(\)[\s\S]*redoDrawingScene/u);
assert.match(editor, /savePrimaryWorkOrderDrawing\([^)]*scene: submitted/u);
assert.doesNotMatch(scenePolicy, /DrawingCamera|centerX|centerY|zoom/u);
assert.doesNotMatch(api, /DrawingCamera|centerX|centerY|zoom/u);
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.match(contracts, /width: 1_000[\s\S]*height: 1_400/u);
assert.doesNotMatch(cameraPolicy, /iPhone|iPad|modelName|Platform|devicePixelRatio/iu);
assert.doesNotMatch(packageJson + mobilePackageJson, /react-native-gesture-handler|react-native-reanimated|react-native-worklets/u);
assert.match(editor, /testID="work-order-sketch-compact-toolbar"[\s\S]*testID="work-order-sketch-canvas-stage"[\s\S]*testID="work-order-sketch-footer"/u, "fixed top/middle/bottom structure remains");
assert.match(editor, /drawingToolMenu: \{[^}]*position: "absolute"/u, "Drawing Tool overlay remains");
for (const forbidden of ["크기 조절", "회전", "끝점 편집", "캔버스 이동"]) {
  assert.doesNotMatch(editor, new RegExp(`accessibilityLabel="${forbidden}"`, "u"));
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-initial-cover-pinch-reliability",
  previousPermanentInventoryRetained: 282,
  addedPermanentChecks: 1,
  finalPermanentInventory: 283,
  assertionsMinimum: 55,
  initialCamera: "Cover",
  minimumZoom: "Fit=1",
  maximumZoom: 4,
  touchPair: "stable-native-identifiers-with-current-camera-rebase",
  sceneSchemaVersion: 1,
  sceneApiSchemaMigrationDelta: "0/0/0/0",
  dependencyNativeConfigEasDelta: "0/0/0/0",
  physicalResultInferred: false,
}));

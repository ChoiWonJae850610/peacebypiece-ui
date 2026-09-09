#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-raw-camera-"));
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
    "apps/mobile/features/work-orders/drawing/drawingRawCameraInputLifecycle.ts",
  ], { cwd: process.cwd(), stdio: "pipe" });
} catch (error) {
  fs.rmSync(compiledDirectory, { recursive: true, force: true });
  throw error;
}
process.on("exit", () => fs.rmSync(compiledDirectory, { recursive: true, force: true }));

const require = createRequire(import.meta.url);
const drawing = require(path.join(compiledDirectory, "lib/domain/drawing/index.js"));
const { resolveDrawingRawCameraInputTransition: transition } = require(path.join(
  compiledDirectory,
  "apps/mobile/features/work-orders/drawing/drawingRawCameraInputLifecycle.js",
));
const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const lifecycle = read("apps/mobile/features/work-orders/drawing/drawingRawCameraInputLifecycle.ts");
const cameraPolicy = read("lib/domain/drawing/cameraGesture.ts");
const scenePolicy = read("lib/domain/drawing/scene.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const api = read("apps/mobile/lib/api/drawingApi.ts");
const packageJson = read("package.json") + read("apps/mobile/package.json");

const idle = Object.freeze({ cameraActive: false, suppressionActive: false });
const camera = Object.freeze({ cameraActive: true, suppressionActive: true });
const suppressed = Object.freeze({ cameraActive: false, suppressionActive: true });

const firstStart = transition({ activeTouchCount: 1, event: "start", state: idle });
assert.equal(firstStart.acquireCamera, false);
assert.equal(firstStart.cancelOneFingerTransient, false);
assert.equal(firstStart.updateCamera, false);
assert.equal(firstStart.endCamera, false);
assert.deepEqual(firstStart.nextState, idle);

const secondStart = transition({ activeTouchCount: 2, event: "start", state: idle });
assert.equal(secondStart.acquireCamera, true, "second-finger touch-down acquires Camera without waiting for move");
assert.equal(secondStart.cancelOneFingerTransient, true);
assert.equal(secondStart.updateCamera, false);
assert.equal(secondStart.endCamera, false);
assert.equal(secondStart.releaseSuppression, false);
assert.deepEqual(secondStart.nextState, camera);

const duplicateStart = transition({ activeTouchCount: 2, event: "start", state: camera });
assert.equal(duplicateStart.acquireCamera, false, "duplicate raw start cannot restart Camera");
assert.equal(duplicateStart.cancelOneFingerTransient, false, "duplicate raw start cannot cancel twice");
assert.equal(duplicateStart.updateCamera, false);
assert.equal(duplicateStart.endCamera, false);
assert.deepEqual(duplicateStart.nextState, camera);

const thirdStart = transition({ activeTouchCount: 3, event: "start", state: camera });
assert.equal(thirdStart.acquireCamera, false);
assert.equal(thirdStart.cancelOneFingerTransient, false);
assert.deepEqual(thirdStart.nextState, camera);

const rawMove = transition({ activeTouchCount: 2, event: "move", state: camera });
assert.equal(rawMove.updateCamera, true);
assert.equal(rawMove.acquireCamera, false);
assert.equal(rawMove.endCamera, false);
assert.deepEqual(rawMove.nextState, camera);
const rawMoveWithThird = transition({ activeTouchCount: 3, event: "move", state: camera });
assert.equal(rawMoveWithThird.updateCamera, true, "third touch keeps the stable pair update safe");
assert.equal(transition({ activeTouchCount: 1, event: "move", state: camera }).updateCamera, false);
assert.equal(transition({ activeTouchCount: 2, event: "move", state: idle }).updateCamera, false);

const thirdFingerEnd = transition({ activeTouchCount: 2, event: "end", state: camera });
assert.equal(thirdFingerEnd.updateCamera, true);
assert.equal(thirdFingerEnd.endCamera, false);
assert.deepEqual(thirdFingerEnd.nextState, camera);

const dropToOne = transition({ activeTouchCount: 1, event: "end", state: camera });
assert.equal(dropToOne.endCamera, true);
assert.equal(dropToOne.releaseSuppression, false);
assert.deepEqual(dropToOne.nextState, suppressed);
const remainingMove = transition({ activeTouchCount: 1, event: "move", state: suppressed });
assert.equal(remainingMove.acquireCamera, false);
assert.equal(remainingMove.updateCamera, false);
assert.deepEqual(remainingMove.nextState, suppressed);
const fullRelease = transition({ activeTouchCount: 0, event: "end", state: suppressed });
assert.equal(fullRelease.endCamera, false, "Camera already ended exactly once at pair loss");
assert.equal(fullRelease.releaseSuppression, true);
assert.deepEqual(fullRelease.nextState, idle);

const directFullRelease = transition({ activeTouchCount: 0, event: "end", state: camera });
assert.equal(directFullRelease.endCamera, true);
assert.equal(directFullRelease.releaseSuppression, true);
assert.deepEqual(directFullRelease.nextState, idle);

const reacquireBeforeFullRelease = transition({ activeTouchCount: 2, event: "start", state: suppressed });
assert.equal(reacquireBeforeFullRelease.acquireCamera, true);
assert.equal(reacquireBeforeFullRelease.cancelOneFingerTransient, false, "same suppressed sequence does not double-cancel one-finger work");
assert.deepEqual(reacquireBeforeFullRelease.nextState, camera);

const cancelWithOneRemaining = transition({ activeTouchCount: 1, event: "cancel", state: camera });
assert.equal(cancelWithOneRemaining.endCamera, true);
assert.equal(cancelWithOneRemaining.releaseSuppression, false);
assert.deepEqual(cancelWithOneRemaining.nextState, suppressed);
const cancelAll = transition({ activeTouchCount: 0, event: "cancel", state: camera });
assert.equal(cancelAll.endCamera, true);
assert.equal(cancelAll.releaseSuppression, true);
assert.deepEqual(cancelAll.nextState, idle);
const suppressedCancelAll = transition({ activeTouchCount: 0, event: "cancel", state: suppressed });
assert.equal(suppressedCancelAll.endCamera, false);
assert.equal(suppressedCancelAll.releaseSuppression, true);
assert.deepEqual(suppressedCancelAll.nextState, idle);

let repeatedState = idle;
for (let cycle = 0; cycle < 10; cycle += 1) {
  const acquired = transition({ activeTouchCount: 2, event: "start", state: repeatedState });
  assert.equal(acquired.acquireCamera, true, `cycle ${cycle + 1} acquires once`);
  const duplicate = transition({ activeTouchCount: 2, event: "start", state: acquired.nextState });
  assert.equal(duplicate.acquireCamera, false, `cycle ${cycle + 1} duplicate begin zero`);
  const ended = transition({ activeTouchCount: 1, event: "end", state: duplicate.nextState });
  assert.equal(ended.endCamera, true, `cycle ${cycle + 1} ends at pair loss`);
  const released = transition({ activeTouchCount: 0, event: "end", state: ended.nextState });
  assert.equal(released.releaseSuppression, true, `cycle ${cycle + 1} releases only at zero touches`);
  repeatedState = released.nextState;
}
assert.deepEqual(repeatedState, idle);

const panResponderStart = editor.indexOf("PanResponder.create({");
const panResponderEnd = editor.indexOf("  }));", panResponderStart);
const panResponderSource = editor.slice(panResponderStart, panResponderEnd);
assert.ok(panResponderStart >= 0 && panResponderEnd > panResponderStart);
assert.match(editor, /onTouchStart=\{handleRawCameraTouchStart\}/u);
assert.match(editor, /onTouchMove=\{handleRawCameraTouchMove\}/u);
assert.match(editor, /onTouchEnd=\{handleRawCameraTouchEnd\}/u);
assert.match(editor, /onTouchCancel=\{handleRawCameraTouchCancel\}/u, "RN View's typed cancellation callback owns raw Camera cancellation");
assert.match(editor, /handleRawCameraTouch\("start", event\)/u);
assert.match(editor, /handleRawCameraTouch\("move", event\)/u);
assert.match(editor, /handleRawCameraTouch\("end", event\)/u);
assert.match(editor, /handleRawCameraTouch\("cancel", event\)/u);
assert.match(editor, /cameraInputActiveRef = useRef\(false\)/u);
assert.match(editor, /transition\.cancelOneFingerTransient[\s\S]*selectElement\(selectionBeforeOneFingerGestureRef\.current\)[\s\S]*discardActiveGesture\(\)/u);
assert.match(editor, /transition\.nextState\.cameraActive[\s\S]*transition\.acquireCamera\) beginRawCameraGesture\(touches\)/u, "raw second-finger handler arms state and begins Camera in the same callback");
assert.match(editor, /beginRawCameraGesture[\s\S]*camera: cameraRef\.current/u);
assert.match(editor, /updateRawCameraGesture[\s\S]*resolveDrawingCameraGestureUpdate/u);
assert.match(editor, /projectCurrentCamera\(update\.camera\)[\s\S]*cameraGestureRef\.current = update\.gesture/u);
assert.match(editor, /captureSelectionBeforeOneFingerGesture[\s\S]*selectionBeforeOneFingerGestureRef\.current = selectedElementIdRef\.current/u);
assert.match(editor, /onPanResponderGrant:[\s\S]*cameraInputActiveRef\.current[\s\S]*suppressOneFingerUntilReleaseRef\.current/u);
assert.match(editor, /onPanResponderMove:[\s\S]*event\.nativeEvent\.touches\.length !== 1[\s\S]*cameraInputActiveRef\.current/u);
assert.match(editor, /onPanResponderRelease:[\s\S]*cameraInputActiveRef\.current \|\| suppressOneFingerUntilReleaseRef\.current\) return/u);
assert.match(editor, /onPanResponderTerminate:[\s\S]*cameraInputActiveRef\.current \|\| suppressOneFingerUntilReleaseRef\.current\) return/u);
assert.doesNotMatch(panResponderSource, /beginRawCameraGesture|updateRawCameraGesture|beginDrawingCameraGesture|resolveDrawingCameraGestureUpdate/u, "PanResponder has zero Camera update entry");
assert.doesNotMatch(panResponderSource, /touches\.length >= 2/u, "PanResponder no longer owns multi-touch acquisition");
assert.equal((editor.match(/onTouchMove=\{handleRawCameraTouchMove\}/gu) ?? []).length, 1, "one physical raw Camera move path");
assert.equal((editor.match(/function updateRawCameraGesture/gu) ?? []).length, 1);
assert.match(lifecycle, /event === "start" && hasCameraPair && !input\.state\.cameraActive/u);
assert.match(lifecycle, /cancelOneFingerTransient: !input\.state\.suppressionActive/u);
assert.match(lifecycle, /event === "end" && input\.state\.cameraActive/u);
assert.match(lifecycle, /suppressionActive: !releaseSuppression/u);

const touch = (identifier, localX, localY, pageX, pageY) => Object.freeze({ identifier, localX, localY, pageX, pageY });
const viewport = Object.freeze({ width: 400, height: 800 });
const baseCamera = drawing.createDrawingCoverCamera(viewport);
const baseTouches = Object.freeze([
  touch("a", 100, 300, 500, 700),
  touch("b", 200, 300, 600, 700),
]);
const gesture = drawing.beginDrawingCameraGesture({ camera: baseCamera, touches: baseTouches, viewport, viewportGeneration: 5 });
assert.ok(gesture);
assert.deepEqual(gesture.touchIdentifiers, ["a", "b"]);
const eitherFirst = drawing.resolveDrawingCameraGestureUpdate({ gesture, touches: [touch("a", 100, 300, 498, 700), baseTouches[1]], viewport, viewportGeneration: 5 });
const eitherSecond = drawing.resolveDrawingCameraGestureUpdate({ gesture, touches: [baseTouches[0], touch("b", 200, 300, 602, 700)], viewport, viewportGeneration: 5 });
assert.ok(eitherFirst.camera.zoom > baseCamera.zoom);
assert.ok(eitherSecond.camera.zoom > baseCamera.zoom);
const reordered = drawing.resolveDrawingCameraGestureUpdate({ gesture, touches: [baseTouches[1], baseTouches[0]], viewport, viewportGeneration: 5 });
assert.equal(reordered.camera.zoom, baseCamera.zoom);
const minimum = drawing.resolveDrawingCameraGestureUpdate({ gesture, touches: [touch("a", 100, 300, 549, 700), touch("b", 200, 300, 551, 700)], viewport, viewportGeneration: 5 });
assert.equal(minimum.camera.zoom, 1);
assert.equal(minimum.rebasedAtBoundary, "min");

assert.match(cameraPolicy, /input\.baseZoom \* input\.currentPageDistance \/ input\.basePageDistance/u);
assert.match(cameraPolicy, /isPushingFartherIntoZoomBoundary/u);
assert.doesNotMatch(cameraPolicy, /sensitivity|exponent|dead.?zone|snapZoom/iu);
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.match(contracts, /width: 1_000[\s\S]*height: 1_400/u);
assert.doesNotMatch(scenePolicy + api, /DrawingCamera|cameraGesture|cameraInputActive/u);
assert.doesNotMatch(packageJson, /react-native-gesture-handler|react-native-reanimated|react-native-worklets/u);
for (const forbidden of ["크기 조절", "회전", "끝점 편집", "정확한 A4"]) {
  assert.doesNotMatch(editor, new RegExp(`accessibilityLabel="${forbidden}"`, "u"));
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-raw-multitouch-camera-acquisition",
  previousPermanentInventoryRetained: 285,
  addedPermanentChecks: 1,
  finalPermanentInventory: 286,
  assertionsMinimum: 82,
  oneFingerOwner: "PanResponder",
  multiTouchCameraOwner: "raw-workbench-touch-stream",
  secondFingerAcquisition: "immediate-touch-start",
  panResponderCameraUpdateEntries: 0,
  sceneHistoryNetworkPersistenceDelta: "0/0/0/0",
  dependencyNativeConfigEasApiSchemaDelta: "0/0/0/0/0/0",
  physicalResultInferred: false,
}));

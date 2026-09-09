#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-selection-move-"));
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
const translationSource = read("lib/domain/drawing/translation.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const style = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 4 });

const elements = Object.freeze([
  Object.freeze({ id: "stroke:fragment", kind: "freehand", points: Object.freeze([{ x: 100, y: 100 }, { x: 180, y: 130 }]), style }),
  Object.freeze({ id: "line:one", kind: "line", start: { x: 120, y: 220 }, end: { x: 300, y: 260 }, style }),
  Object.freeze({ id: "arrow:one", kind: "arrow", start: { x: 140, y: 350 }, end: { x: 320, y: 390 }, style }),
  Object.freeze({ id: "rectangle:one", kind: "rectangle", bounds: { x: 160, y: 470, width: 220, height: 140 }, style }),
  Object.freeze({ id: "ellipse:one", kind: "ellipse", bounds: { x: 180, y: 700, width: 240, height: 120 }, style }),
  Object.freeze({ id: "text:one", kind: "text", anchor: { x: 200, y: 980 }, content: "포켓 2cm 위", fontSize: 34, style }),
]);
const scene = drawing.createDrawingScene(elements);
const delta = Object.freeze({ x: 75, y: 45 });

const moved = elements.map((element) => drawing.resolveDrawingElementTranslation(element, delta));
for (let index = 0; index < moved.length; index += 1) {
  assert.equal(moved[index].changed, true, `${elements[index].kind} moves`);
  assert.deepEqual(moved[index].delta, delta, `${elements[index].kind} uses exact WORLD delta`);
  assert.equal(moved[index].element.id, elements[index].id, `${elements[index].kind} preserves id`);
  assert.equal(moved[index].element.kind, elements[index].kind, `${elements[index].kind} preserves kind`);
  assert.deepEqual(moved[index].element.style, style, `${elements[index].kind} preserves style`);
}
assert.deepEqual(moved[0].element.points, [{ x: 175, y: 145 }, { x: 255, y: 175 }], "freehand points translate together");
assert.deepEqual(moved[1].element.start, { x: 195, y: 265 }, "line start translates");
assert.deepEqual(moved[1].element.end, { x: 375, y: 305 }, "line end translates");
assert.deepEqual(moved[2].element.start, { x: 215, y: 395 }, "arrow start translates");
assert.deepEqual(moved[2].element.end, { x: 395, y: 435 }, "arrow end translates");
assert.deepEqual(moved[3].element.bounds, { x: 235, y: 515, width: 220, height: 140 }, "rectangle moves without resize");
assert.deepEqual(moved[4].element.bounds, { x: 255, y: 745, width: 240, height: 120 }, "ellipse moves without resize");
assert.deepEqual(moved[5].element.anchor, { x: 275, y: 1025 }, "text anchor translates");
assert.equal(moved[5].element.content, "포켓 2cm 위", "text content is unchanged");
assert.equal(moved[5].element.fontSize, 34, "text style size is unchanged");

const noMove = drawing.resolveDrawingElementTranslation(elements[1], { x: 0, y: 0 });
assert.equal(noMove.changed, false, "zero delta is not a move");
assert.strictEqual(noMove.element, elements[1], "zero delta preserves element identity");
const rightClamp = drawing.resolveDrawingElementTranslation(elements[3], { x: 2_000, y: 0 });
assert.equal(rightClamp.delta.x, 620, "existing Scene-v1 canvas bounds clamp the whole rectangle");
assert.equal(rightClamp.element.bounds.x + rightClamp.element.bounds.width, 1_000, "clamped rectangle remains valid");
const topClamp = drawing.resolveDrawingElementTranslation(elements[0], { x: 0, y: -500 });
assert.equal(topClamp.delta.y, -100, "existing Scene-v1 canvas bounds clamp all stroke points together");
assert.deepEqual(topClamp.element.points, [{ x: 100, y: 0 }, { x: 180, y: 30 }], "clamp does not distort freehand geometry");
assert.throws(() => drawing.resolveDrawingElementTranslation(elements[0], { x: Number.NaN, y: 0 }), /finite/u);

const replaced = drawing.replaceDrawingSceneElement(scene, elements[2].id, moved[2].element);
assert.equal(replaced.elements.length, scene.elements.length, "preview replacement does not duplicate the original");
assert.deepEqual(replaced.elements.map((element) => element.id), scene.elements.map((element) => element.id), "replacement preserves z-order");
assert.deepEqual(replaced.elements[2], moved[2].element, "replacement occupies the exact original slot");
assert.strictEqual(drawing.replaceDrawingSceneElement(scene, "missing", moved[2].element), scene, "missing selected id mutates nothing");
assert.throws(() => drawing.replaceDrawingSceneElement(scene, elements[2].id, moved[1].element), /preserve/u);

const belowSlop = drawing.resolveDrawingSelectionMoveDelta({
  currentScreen: { x: 107, y: 100 }, currentWorld: { x: 135, y: 100 }, minimumScreenDistance: 8,
  startScreen: { x: 100, y: 100 }, startWorld: { x: 100, y: 100 },
});
assert.equal(belowSlop, null, "screen-space wobble below shared slop is selection-only");
const atSlop = drawing.resolveDrawingSelectionMoveDelta({
  currentScreen: { x: 108, y: 100 }, currentWorld: { x: 140, y: 100 }, minimumScreenDistance: 8,
  startScreen: { x: 100, y: 100 }, startWorld: { x: 100, y: 100 },
});
assert.deepEqual(atSlop, { x: 40, y: 0 }, "slop boundary activates exact WORLD delta");
assert.equal(drawing.resolveDrawingSelectionMoveDelta({
  currentScreen: { x: 120, y: 120 }, currentWorld: { x: 100, y: 100 }, minimumScreenDistance: 8,
  startScreen: { x: 100, y: 100 }, startWorld: { x: 100, y: 100 },
}), null, "screen movement with zero WORLD delta is no-op");
assert.throws(() => drawing.resolveDrawingSelectionMoveDelta({
  currentScreen: { x: 1, y: 1 }, currentWorld: { x: 1, y: 1 }, minimumScreenDistance: -1,
  startScreen: { x: 0, y: 0 }, startWorld: { x: 0, y: 0 },
}), /non-negative/u);

let history = drawing.createDrawingSceneHistory(scene);
history = drawing.commitDrawingScene(history, replaced);
assert.equal(history.past.length, 1, "one changed drag creates one history entry");
assert.deepEqual(history.current.elements[2], moved[2].element, "pointerUp commits moved geometry once");
history = drawing.undoDrawingScene(history);
assert.deepEqual(history.current, scene, "Undo restores exact pre-move Scene");
history = drawing.redoDrawingScene(history);
assert.deepEqual(history.current, replaced, "Redo restores exact moved Scene");
assert.equal(drawing.commitDrawingScene(history, history.current), history, "no-op release adds no history");

const camera = drawing.createDrawingCamera();
const phoneViewport = { width: 375, height: 525 };
const tabletViewport = { width: 768, height: 1075.2 };
for (const viewport of [phoneViewport, tabletViewport]) {
  const start = drawing.worldToScreen({ x: 200, y: 300 }, camera, viewport);
  const end = drawing.worldToScreen({ x: 275, y: 345 }, camera, viewport);
  const resolved = drawing.resolveDrawingSelectionMoveDelta({
    currentScreen: end,
    currentWorld: drawing.screenToWorld(end, camera, viewport),
    minimumScreenDistance: 8,
    startScreen: start,
    startWorld: drawing.screenToWorld(start, camera, viewport),
  });
  assert.ok(Math.abs(resolved.x - 75) < 1e-9, "viewport inverse preserves WORLD x delta");
  assert.ok(Math.abs(resolved.y - 45) < 1e-9, "viewport inverse preserves WORLD y delta");
}

assert.match(editor, /DRAWING_SELECTION_MOVE_SCREEN_SLOP = WAFL_THEME\.spacing\.sm/u, "slop derives from a shared screen-space token");
assert.match(editor, /onPanResponderGrant:[\s\S]*hitTestDrawingSceneTopmost\(scene, point\)/u, "pointerDown uses shared topmost hit-test");
assert.match(editor, /const moveTarget = actualHit \?\? \(selectedPickup \? selectedElement : null\)[\s\S]*selectionMoveGestureRef\.current = moveTarget/u, "direct drag still captures an actual topmost hit object while selected pickup remains fallback-only");
assert.match(editor, /rawWorldPointFromEvent[\s\S]*screenToWorld/u, "move delta uses inverse viewport projection without per-sample point clamp");
assert.match(editor, /setSelectionMovePreviewScene\(planSelectionMove/u, "pointerMove authors transient preview only");
assert.match(editor, /displayedScene = selectionMovePreviewScene \?\? eraserPreviewScene \?\? currentScene/u, "preview replaces original in one displayed Scene");
assert.match(editor, /displayedSelectedElement[\s\S]*projectDrawingSelectionOutline\(displayedSelectedElement/u, "selection outline follows preview geometry");
assert.match(editor, /if \(nextScene !== null\) updateHistory\(commitDrawingScene/u, "pointerUp is the only move Scene/history commit");
assert.match(editor, /discardActiveGesture[\s\S]*clearSelectionMovePreview/u, "cancel and lifecycle invalidation clear move preview");
assert.match(editor, /if \(toolRef\.current === "selection"\)[\s\S]*return;/u, "Selection path cannot enter text authoring");
assert.match(editor, /selectedId !== null && !next\.current\.elements\.some/u, "Undo/Redo keeps selection when the same id still exists");
assert.match(translationSource, /from "\.\/contracts"/u);
assert.doesNotMatch(translationSource, /\b(?:react|expo|screenToWorld|viewport|device|iPhone|iPad)\b/iu, "pure translator has no UI/device dependency");
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
for (const forbidden of ["크기 조절", "회전", "다중 선택", "올가미", "확대", "축소"]) {
  assert.doesNotMatch(editor, new RegExp(`accessibilityLabel="${forbidden}"`, "u"));
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-selection-object-move",
  previousPermanentInventoryRetained: 277,
  addedPermanentChecks: 1,
  finalPermanentInventory: 278,
  assertionsMinimum: 65,
  sceneSchemaVersion: 1,
  apiDelta: 0,
  migrationDelta: 0,
  dependencyDelta: 0,
  nativeDelta: 0,
  physicalResultInferred: false,
}));

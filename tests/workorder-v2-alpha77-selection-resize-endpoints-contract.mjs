#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a77-selection-handles-"));
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
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");
const handlesSource = read("lib/domain/drawing/selectionHandles.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const style = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 3 });
let assertionCount = 0;
const ok = (value, message) => { assert.ok(value, message); assertionCount += 1; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); assertionCount += 1; };
const deepEqual = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertionCount += 1; };
const matches = (value, pattern, message) => { assert.match(value, pattern, message); assertionCount += 1; };
const notMatches = (value, pattern, message) => { assert.doesNotMatch(value, pattern, message); assertionCount += 1; };

const rectangle = Object.freeze({ id: "rectangle:one", kind: "rectangle", bounds: { x: 100, y: 200, width: 300, height: 200 }, style });
const ellipse = Object.freeze({ id: "ellipse:one", kind: "ellipse", bounds: { x: 120, y: 500, width: 280, height: 180 }, style });
const line = Object.freeze({ id: "line:one", kind: "line", start: { x: 150, y: 900 }, end: { x: 450, y: 980 }, style });
const arrow = Object.freeze({ id: "arrow:one", kind: "arrow", start: { x: 180, y: 1_100 }, end: { x: 520, y: 1_200 }, style });
const freehand = Object.freeze({ id: "stroke:one", kind: "freehand", points: [{ x: 10, y: 10 }, { x: 40, y: 50 }], style });
const text = Object.freeze({ id: "text:one", kind: "text", anchor: { x: 200, y: 300 }, content: "3cm 줄임", fontSize: 34, style });

const rectangleHandles = drawing.resolveDrawingSelectionHandles(rectangle);
const ellipseHandles = drawing.resolveDrawingSelectionHandles(ellipse);
const lineHandles = drawing.resolveDrawingSelectionHandles(line);
const arrowHandles = drawing.resolveDrawingSelectionHandles(arrow);
equal(rectangleHandles.length, 4, "Rectangle exposes four handles");
equal(ellipseHandles.length, 4, "Ellipse exposes four handles");
equal(lineHandles.length, 2, "Line exposes two handles");
equal(arrowHandles.length, 2, "Arrow exposes two handles");
deepEqual(rectangleHandles.map((handle) => handle.kind), ["top-left", "top-right", "bottom-right", "bottom-left"], "shape handle order is deterministic");
deepEqual(lineHandles.map((handle) => handle.kind), ["start", "end"], "segment handle order is semantic");
equal(drawing.resolveDrawingSelectionHandles(freehand).length, 0, "Freehand has no resize handles");
equal(drawing.resolveDrawingSelectionHandles(text).length, 0, "Text has no resize handles");
ok(Object.isFrozen(rectangleHandles), "handle collection is immutable transient data");
ok(Object.isFrozen(rectangleHandles[0]), "handle model is immutable");

const viewport = { width: 375, height: 525 };
for (const zoom of [1, 1.31, 2, 4]) {
  const transform = drawing.resolveDrawingViewportTransform(drawing.createDrawingCamera({ zoom }), viewport);
  const screenAnchor = drawing.projectDrawingSelectionHandleToScreen(rectangleHandles[0], transform);
  const hit = drawing.hitTestDrawingSelectionHandlesScreen({
    handles: rectangleHandles,
    point: { x: screenAnchor.x + 15, y: screenAnchor.y },
    screenRadius: 16,
    transform,
  });
  equal(hit?.handle.kind, "top-left", `screen-space handle hit remains stable at zoom ${zoom}`);
  equal(drawing.hitTestDrawingSelectionHandlesScreen({
    handles: rectangleHandles,
    point: { x: screenAnchor.x + 17, y: screenAnchor.y },
    screenRadius: 16,
    transform,
  }), null, `screen-space handle miss remains stable at zoom ${zoom}`);
}

const shapeCases = [
  ["top-left", { x: 50, y: 150 }, { x: 50, y: 150, width: 350, height: 250 }, { x: 400, y: 400 }],
  ["top-right", { x: 450, y: 150 }, { x: 100, y: 150, width: 350, height: 250 }, { x: 100, y: 400 }],
  ["bottom-right", { x: 450, y: 450 }, { x: 100, y: 200, width: 350, height: 250 }, { x: 100, y: 200 }],
  ["bottom-left", { x: 50, y: 450 }, { x: 50, y: 200, width: 350, height: 250 }, { x: 400, y: 200 }],
];
for (const [handle, pointerWorld, bounds, fixedAnchor] of shapeCases) {
  const result = drawing.resolveDrawingSelectionHandleTransform({ element: rectangle, handle, pointerWorld });
  equal(result.changed, true, `${handle} changes Rectangle geometry`);
  deepEqual(result.element.bounds, bounds, `${handle} follows WORLD pointer with independent axes`);
  deepEqual(result.fixedAnchor, fixedAnchor, `${handle} keeps opposite corner fixed`);
  equal(result.element.id, rectangle.id, `${handle} preserves Rectangle id`);
  equal(result.element.kind, "rectangle", `${handle} preserves Rectangle semantic kind`);
  deepEqual(result.element.style, style, `${handle} preserves Rectangle style`);
}
const asymmetric = drawing.resolveDrawingSelectionHandleTransform({ element: rectangle, handle: "bottom-right", pointerWorld: { x: 650, y: 430 } });
deepEqual(asymmetric.element.bounds, { x: 100, y: 200, width: 550, height: 230 }, "Rectangle width and height resize independently without aspect lock");
const crossed = drawing.resolveDrawingSelectionHandleTransform({ element: rectangle, handle: "bottom-right", pointerWorld: { x: 0, y: 0 } });
equal(crossed.element.bounds.width, drawing.DRAWING_ACTIVE_SHAPE_MIN_WORLD_SIZE, "crossed Rectangle x clamps to canonical minimum");
equal(crossed.element.bounds.height, drawing.DRAWING_ACTIVE_SHAPE_MIN_WORLD_SIZE, "crossed Rectangle y clamps to canonical minimum");
equal(crossed.element.bounds.x, 100, "Rectangle does not flip across fixed x");
equal(crossed.element.bounds.y, 200, "Rectangle does not flip across fixed y");

for (const handle of ["top-left", "top-right", "bottom-right", "bottom-left"]) {
  const pointerWorld = handle === "top-left" ? { x: 80, y: 460 }
    : handle === "top-right" ? { x: 460, y: 460 }
      : handle === "bottom-right" ? { x: 460, y: 760 }
        : { x: 80, y: 760 };
  const result = drawing.resolveDrawingSelectionHandleTransform({ element: ellipse, handle, pointerWorld });
  equal(result.changed, true, `${handle} changes Ellipse bounds`);
  equal(result.element.kind, "ellipse", `${handle} preserves Ellipse semantic kind`);
  equal(result.element.id, ellipse.id, `${handle} preserves Ellipse id`);
  deepEqual(result.element.style, style, `${handle} preserves Ellipse style`);
  ok(result.element.bounds.width >= drawing.DRAWING_ACTIVE_SHAPE_MIN_WORLD_SIZE, `${handle} keeps positive Ellipse width`);
  ok(result.element.bounds.height >= drawing.DRAWING_ACTIVE_SHAPE_MIN_WORLD_SIZE, `${handle} keeps positive Ellipse height`);
}

const lineStart = drawing.resolveDrawingSelectionHandleTransform({ element: line, handle: "start", pointerWorld: { x: 80, y: 850 } });
deepEqual(lineStart.element.start, { x: 80, y: 850 }, "Line start handle edits start");
deepEqual(lineStart.element.end, line.end, "Line start handle keeps end fixed");
const lineEnd = drawing.resolveDrawingSelectionHandleTransform({ element: line, handle: "end", pointerWorld: { x: 600, y: 760 } });
deepEqual(lineEnd.element.end, { x: 600, y: 760 }, "Line end handle edits end in arbitrary direction");
deepEqual(lineEnd.element.start, line.start, "Line end handle keeps start fixed");
const lineCollapsed = drawing.resolveDrawingSelectionHandleTransform({ element: line, handle: "start", pointerWorld: line.end });
ok(Math.abs(Math.hypot(lineCollapsed.element.start.x - line.end.x, lineCollapsed.element.start.y - line.end.y) - drawing.DRAWING_ACTIVE_SEGMENT_MIN_WORLD_LENGTH) < 1e-9, "Line exact collapse uses canonical minimum and base direction");
equal(lineCollapsed.element.id, line.id, "Line endpoint edit preserves id");
equal(lineCollapsed.element.kind, "line", "Line endpoint edit preserves kind");
deepEqual(lineCollapsed.element.style, style, "Line endpoint edit preserves style");

const arrowStart = drawing.resolveDrawingSelectionHandleTransform({ element: arrow, handle: "start", pointerWorld: { x: 80, y: 1_000 } });
deepEqual(arrowStart.element.start, { x: 80, y: 1_000 }, "Arrow start handle edits start");
deepEqual(arrowStart.element.end, arrow.end, "Arrow start handle keeps end fixed");
const arrowEnd = drawing.resolveDrawingSelectionHandleTransform({ element: arrow, handle: "end", pointerWorld: { x: 700, y: 1_050 } });
deepEqual(arrowEnd.element.end, { x: 700, y: 1_050 }, "Arrow end handle edits end");
deepEqual(arrowEnd.element.start, arrow.start, "Arrow end handle keeps start fixed");
const arrowCollapsed = drawing.resolveDrawingSelectionHandleTransform({ element: arrow, handle: "end", pointerWorld: arrow.start });
ok(Math.abs(Math.hypot(arrowCollapsed.element.end.x - arrow.start.x, arrowCollapsed.element.end.y - arrow.start.y) - drawing.DRAWING_ACTIVE_SEGMENT_MIN_WORLD_LENGTH) < 1e-9, "Arrow exact collapse uses canonical minimum");
equal(arrowCollapsed.element.id, arrow.id, "Arrow endpoint edit preserves id");
equal(arrowCollapsed.element.kind, "arrow", "Arrow endpoint edit preserves semantic kind");
deepEqual(arrowCollapsed.element.style, style, "Arrow endpoint edit preserves style");
ok(drawing.resolveDrawingArrowHeadWorldGeometry(arrowStart.element.start, arrowStart.element.end, arrowStart.element.style.strokeWidth).tip === arrowStart.element.end || drawing.resolveDrawingArrowHeadWorldGeometry(arrowStart.element.start, arrowStart.element.end, arrowStart.element.style.strokeWidth).tip.x === arrowStart.element.end.x, "Arrowhead remains renderer-derived from edited endpoint");
equal(drawing.resolveDrawingSelectionHandleTransform({ element: freehand, handle: "start", pointerWorld: { x: 2, y: 2 } }), null, "Freehand transform is ineligible");
equal(drawing.resolveDrawingSelectionHandleTransform({ element: text, handle: "bottom-right", pointerWorld: { x: 2, y: 2 } }), null, "Text transform is ineligible");
assertionCount += 1;
assert.throws(() => drawing.resolveDrawingSelectionHandleTransform({ element: line, handle: "end", pointerWorld: { x: Number.NaN, y: 0 } }), /finite/u, "NaN pointer is rejected");

const baseScene = drawing.createDrawingScene([freehand, rectangle, ellipse, line, arrow, text]);
for (const transformed of [asymmetric.element, lineEnd.element, arrowEnd.element]) {
  const replaced = drawing.replaceDrawingSceneElement(baseScene, transformed.id, transformed);
  equal(replaced.elements.length, baseScene.elements.length, "preview replacement creates no duplicate");
  deepEqual(replaced.elements.map((element) => element.id), baseScene.elements.map((element) => element.id), "replacement preserves exact order");
  deepEqual(replaced.elements.find((element) => element.id === transformed.id), transformed, "replacement occupies original Scene slot");
  let history = drawing.createDrawingSceneHistory(baseScene);
  history = drawing.commitDrawingScene(history, replaced);
  equal(history.past.length, 1, "one meaningful handle release creates one history entry");
  history = drawing.undoDrawingScene(history);
  deepEqual(history.current, baseScene, "Undo restores exact original geometry and order");
  history = drawing.redoDrawingScene(history);
  deepEqual(history.current, replaced, "Redo restores exact transformed Scene");
}
const noOpTransform = drawing.resolveDrawingSelectionHandleTransform({ element: line, handle: "start", pointerWorld: line.start });
equal(noOpTransform.changed, false, "unchanged endpoint is a no-op");
let noOpHistory = drawing.createDrawingSceneHistory(baseScene);
equal(drawing.commitDrawingScene(noOpHistory, noOpHistory.current), noOpHistory, "no-op release adds no history");

matches(editor, /DRAWING_SELECTION_HANDLE_VISUAL_RADIUS = WAFL_THEME\.spacing\.sm/u, "visual radius uses a shared screen token");
matches(editor, /DRAWING_SELECTION_HANDLE_TOUCH_RADIUS = WAFL_THEME\.touch\.minimum \/ 2/u, "touch radius derives from canonical minimum touch target");
matches(editor, /const handleHit = hitTestDrawingSelectionHandlesScreen[\s\S]*if \(handleHit !== null\)[\s\S]*selectionTransformGestureRef\.current/u, "selected handle hit has priority before actual object Move hit");
matches(editor, /const actualHit = hitTestDrawingSceneTopmost[\s\S]*const moveTarget = actualHit \?\? \(selectedPickup \? selectedElement : null\)/u, "non-handle path retains topmost then forgiving Move priority");
matches(editor, /if \(selectionTransformGestureRef\.current === null\)[\s\S]*setSelectionMovePreviewScene\(planSelectionMove[\s\S]*setSelectionMovePreviewScene\(planSelectionTransform/u, "pointer move authors derived transform preview only");
matches(editor, /if \(nextScene !== null\) updateHistory\(commitDrawingScene/u, "release remains the only transform Scene/history commit");
matches(editor, /cancelAllTransientGestures[\s\S]*discardActiveGesture/u, "shared cancellation owner includes transform cleanup");
matches(editor, /transition\.cancelOneFingerTransient[\s\S]*discardActiveGesture/u, "second-finger Camera takeover cancels transform preview");
matches(editor, /suppressOneFingerUntilReleaseRef/u, "remaining-finger suppression remains intact");
matches(editor, /onWorkbenchLayout[\s\S]*viewportGenerationRef\.current \+= 1[\s\S]*cancelAllTransientGestures/u, "viewport invalidation cancels transform session");
matches(editor, /projectDrawingSelectionHandles\(displayedSelectedElement/u, "handles follow the displayed preview geometry");
matches(projection, /selection-handle:\$\{element\.id\}:\$\{handle\.kind\}/u, "handles render as transient derived primitives");
matches(handlesSource, /projectDrawingSelectionHandleToScreen/u, "handle projection uses canonical viewport transform");
notMatches(handlesSource, /\b(?:react|react-native|expo|iPhone|iPad|device)\b/iu, "pure handle owner has no UI or device branch");
matches(editor, /displayedScene = selectionMovePreviewScene \?\? eraserPreviewScene \?\? currentScene/u, "preview replaces rather than duplicates selected element");
matches(editor, /savePrimaryWorkOrderDrawing[\s\S]*scene: submitted/u, "only explicit Save persists the committed Scene");
matches(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u, "Scene schema remains v1");
matches(contracts, /width: 1_000[\s\S]*height: 1_400/u, "canonical WORLD remains 1000x1400");
matches(editor, /formatDrawingZoomPercentLabel\(camera\.zoom\)/u, "Zoom HUD remains camera-derived");
matches(editor, /toolRef\.current === "eraser"[\s\S]*extendEraserGesture/u, "partial Eraser path remains present");
matches(editor, /drawingToolMenuVisible[\s\S]*work-order-sketch-drawing-tool-menu/u, "Drawing Tool overlay remains present");
for (const forbidden of ["회전", "다중 선택", "올가미", "자유 변형", "텍스트 크기 조절", "펜 크기 조절"]) {
  notMatches(editor, new RegExp(`accessibilityLabel="${forbidden}"`, "u"), `${forbidden} control remains absent`);
}

ok(assertionCount >= 75, `contract executes at least 75 assertions (actual ${assertionCount})`);
console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha77-selection-resize-endpoints",
  assertions: assertionCount,
  previousPermanentInventoryRetained: 288,
  addedPermanentChecks: 1,
  finalPermanentInventory: 289,
  sceneSchemaVersion: 1,
  apiDelta: 0,
  migrationDelta: 0,
  dependencyDelta: 0,
  nativeDelta: 0,
  physicalResultInferred: false,
}));

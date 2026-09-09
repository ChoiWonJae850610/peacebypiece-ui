#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a75-stroke-eraser-"));
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
const eraser = read("lib/domain/drawing/eraseFreehand.ts");
const visual = read("apps/mobile/features/drawing-poc/drawingEraserVisualFeedback.ts");
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");
const contracts = read("lib/domain/drawing/contracts.ts");

const style = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 4 });
const filledStyle = Object.freeze({ ...style, fillColor: "#FFFFFF" });
const line = Object.freeze({ id: "line:one", kind: "line", start: { x: 100, y: 100 }, end: { x: 500, y: 100 }, style });
const arrow = Object.freeze({ id: "arrow:one", kind: "arrow", start: { x: 100, y: 250 }, end: { x: 500, y: 250 }, style });
const rectangle = Object.freeze({ id: "rectangle:one", kind: "rectangle", bounds: { x: 100, y: 400, width: 400, height: 220 }, style });
const ellipse = Object.freeze({ id: "ellipse:one", kind: "ellipse", bounds: { x: 100, y: 700, width: 400, height: 220 }, style });
const freehand = Object.freeze({ id: "stroke:one", kind: "freehand", points: Object.freeze([{ x: 100, y: 1_050 }, { x: 500, y: 1_050 }]), style });
const text = Object.freeze({ id: "text:immune", kind: "text", anchor: { x: 100, y: 1_250 }, content: "3cm 줄임", fontSize: 34, style });
const filledRectangle = Object.freeze({ ...rectangle, id: "rectangle:filled", bounds: { x: 600, y: 400, width: 200, height: 200 }, style: filledStyle });
const scene = drawing.createDrawingScene([line, arrow, rectangle, ellipse, freehand, text, filledRectangle]);

let idSequence = 0;
const createId = () => `stroke:fragment:${idSequence += 1}`;
const erase = (trail, radius = 30) => {
  const plan = drawing.planDrawingStrokePartialErase(scene, trail, { radius });
  return { plan, result: drawing.applyDrawingStrokePartialErasePlan(scene, plan, createId) };
};

for (const [id, trail] of [
  [line.id, [{ x: 300, y: 100 }]],
  [arrow.id, [{ x: 300, y: 250 }]],
  [rectangle.id, [{ x: 300, y: 400 }]],
  [ellipse.id, [{ x: 500, y: 810 }]],
  [freehand.id, [{ x: 300, y: 1_050 }]],
]) {
  const { plan, result } = erase(trail);
  assert.equal(plan.changed, true, `${id} visible stroke is partially erasable`);
  assert.deepEqual(plan.replacements.map((replacement) => replacement.elementId), [id], `${id} is the only replacement`);
  const replacementIndex = scene.elements.findIndex((element) => element.id === id);
  assert.equal(result.elements[replacementIndex].id, id, `${id} first surviving fragment keeps original id/z-position`);
  assert.equal(result.elements[replacementIndex].kind, "freehand", `${id} touched semantic vector flattens to freehand`);
  assert.equal(result.elements.some((element) => element.id === text.id && element.kind === "text"), true, "text remains semantic and immune");
  assert.equal(result.elements.some((element) => element.id === filledRectangle.id && element.kind === "rectangle"), true, "filled future shape remains immune");
}

const arrowHead = drawing.resolveDrawingArrowHeadWorldGeometry(arrow.start, arrow.end, arrow.style.strokeWidth);
const headPlan = drawing.planDrawingStrokePartialErase(scene, [arrowHead.left], { radius: 16 });
assert.deepEqual(headPlan.replacements.map((replacement) => replacement.elementId), [arrow.id], "arrowhead participates in erasure geometry");

const sweptPlan = drawing.planDrawingStrokePartialErase(scene, [{ x: 300, y: 20 }, { x: 300, y: 1_120 }], { radius: 30 });
assert.ok(sweptPlan.replacements.length >= 4, "swept corridor erases multiple crossed stroked objects without sample gaps");
const sweptScene = drawing.applyDrawingStrokePartialErasePlan(scene, sweptPlan, createId);
assert.equal(new Set(sweptScene.elements.map((element) => element.id)).size, sweptScene.elements.length, "flattened fragments have unique ids");
let history = drawing.createDrawingSceneHistory(scene);
history = drawing.commitDrawingScene(history, sweptScene);
assert.equal(history.past.length, 1, "one eraser gesture creates one history commit");
const flattened = history.current;
history = drawing.undoDrawingScene(history);
assert.deepEqual(history.current, scene, "Undo restores exact semantic kinds/ids/order/geometry");
history = drawing.redoDrawingScene(history);
assert.deepEqual(history.current, flattened, "Redo restores exact flattened Scene");

const immunityPlan = drawing.planDrawingStrokePartialErase(
  drawing.createDrawingScene([text, filledRectangle]),
  [{ x: 100, y: 1_250 }, { x: 700, y: 500 }],
  { radius: 100 },
);
assert.equal(immunityPlan.changed, false, "text and filled future shapes are immune");

assert.match(eraser, /resolveDrawingArrowHeadWorldGeometry/u, "arrow erasure uses canonical renderer-derived arrowhead geometry");
assert.match(eraser, /rectangleStrokeComponents/u, "rectangle flattens its four visible sides");
assert.match(eraser, /ellipseStrokeComponent/u, "ellipse uses deterministic WORLD polyline flattening");
assert.match(eraser, /-Math\.PI \/ 2/u, "ellipse has deterministic canonical start");
assert.match(eraser, /segmentCapsuleIntervals/u, "all stroke kinds share swept-corridor geometry");
assert.match(eraser, /element\.style\.fillColor !== null/u, "filled future shape immunity is explicit");
assert.doesNotMatch(eraser, /screenPixel|devicePixel|iPad|iPhone/iu);

assert.match(visual, /DRAWING_ERASER_TOUCH_RADIUS_RATIO = 0\.7/u);
assert.match(visual, /minimumTouchSize \* DRAWING_ERASER_TOUCH_RADIUS_RATIO/u);
assert.match(visual, /screenRadius \/ viewportScale/u);
assert.match(editor, /resolveDrawingEraserScreenRadius\(WAFL_THEME\.touch\.minimum\)/u, "screen radius derives from the shared minimum touch token");
assert.match(editor, /eraserRadiusWorldRef\.current = radius/u, "one WORLD radius is frozen for each gesture");
assert.match(editor, /planDrawingStrokePartialErase\(scene, trail, \{ radius: eraserRadiusWorldRef\.current \}\)/u);
assert.match(projection, /worldRadius[\s\S]*transform\.scale/u, "ring projects the same gesture WORLD radius");

assert.match(editor, /drawingToolSelectorAnchor/u);
assert.match(editor, /drawingToolDismissLayer/u);
assert.match(editor, /position: "absolute"/u, "palette is an overlay and cannot reflow the canvas");
assert.match(editor, /flexDirection: "column"|drawingToolMenu:[^\n]+gap:/u, "palette items are vertically stacked by default View flow");
assert.doesNotMatch(editor, /drawingToolMenuLabel/u, "overlay palette is icon-only");
assert.match(editor, /work-order-sketch-drawing-tool-menu-dismiss-layer/u);
assert.match(editor, /onPress=\{\(\) => setDrawingToolMenuVisible\(false\)\}/u, "outside press dismisses and is consumed by the overlay Pressable");
for (const label of ["펜", "선", "화살표", "사각형", "타원", "텍스트"]) {
  assert.match(editor, new RegExp(`(?:pen|line|arrow|rectangle|ellipse|text): "${label}"|${label} 도구`, "u"));
}
assert.match(editor, /accessibilityRole="button"/u);
assert.match(editor, /minHeight: WAFL_THEME\.touch\.minimum/u);
assert.match(editor, /onPanResponderMove:[\s\S]*extendEraserGesture/u);
assert.match(editor, /onPanResponderRelease:[\s\S]*commitEraserGesture/u);
assert.match(editor, /displayedScene = (?:selectionMovePreviewScene \?\? )?eraserPreviewScene \?\? currentScene/u, "pointerMove previews remain transient and derive one displayed Scene");
assert.doesNotMatch(contracts, /eraser|fragment/u, "eraser state and flattened-fragment metadata do not enter Scene v1");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha75-overlay-palette-stroke-partial-eraser",
  previousPermanentInventoryRetained: 276,
  addedPermanentChecks: 1,
  finalPermanentInventory: 277,
  supersedes: [
    "alpha75 freehand-only eraser immunity for line/arrow/rectangle/ellipse",
    "alpha75 12-WORLD-radius product eraser policy",
    "alpha75 normal-flow icon-and-label drawing tool menu",
  ],
  sceneSchemaVersion: 1,
  apiDelta: 0,
  migrationDelta: 0,
  dependencyDelta: 0,
  nativeDelta: 0,
  physicalResultInferred: false,
}));

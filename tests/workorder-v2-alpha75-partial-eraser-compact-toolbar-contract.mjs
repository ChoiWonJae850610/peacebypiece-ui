#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a75-partial-eraser-"));
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
const eraserSource = read("lib/domain/drawing/eraseFreehand.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const packageJson = read("apps/mobile/package.json");

const style = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 4 });
const freehand = (id, points) => Object.freeze({ id, kind: "freehand", points: Object.freeze(points), style });
const makeIds = () => {
  let sequence = 0;
  return () => `stroke:fragment:${sequence += 1}`;
};

const original = freehand("stroke:original", [{ x: 100, y: 100 }, { x: 300, y: 100 }]);
const line = Object.freeze({ id: "line:keep", kind: "line", start: { x: 100, y: 220 }, end: { x: 300, y: 220 }, style });
const rectangle = Object.freeze({ id: "rectangle:keep", kind: "rectangle", bounds: { x: 100, y: 300, width: 200, height: 120 }, style });
const ellipse = Object.freeze({ id: "ellipse:keep", kind: "ellipse", bounds: { x: 100, y: 470, width: 200, height: 120 }, style });
const arrow = Object.freeze({ id: "arrow:keep", kind: "arrow", start: { x: 100, y: 650 }, end: { x: 300, y: 650 }, style });
const text = Object.freeze({ id: "text:keep", kind: "text", anchor: { x: 100, y: 800 }, content: "3cm 줄임", fontSize: 34, style });
const mixed = drawing.createDrawingScene([line, original, rectangle, ellipse, arrow, text]);

const middlePlan = drawing.planDrawingFreehandPartialErase(mixed, [{ x: 200, y: 100 }]);
assert.equal(middlePlan.changed, true, "middle erase changes freehand");
assert.equal(middlePlan.replacements.length, 1, "only freehand has replacement plan");
assert.equal(middlePlan.replacements[0].fragments.length, 2, "middle erase splits one stroke into two fragments");
const middleScene = drawing.applyDrawingFreehandPartialErasePlan(mixed, middlePlan, makeIds());
const middleFragments = middleScene.elements.filter((element) => element.kind === "freehand");
assert.equal(middleFragments.length, 2);
assert.equal(middleFragments[0].id, original.id, "first surviving fragment retains original id");
assert.notEqual(middleFragments[1].id, original.id, "additional fragment receives a new id");
assert.equal(new Set(middleScene.elements.map((element) => element.id)).size, middleScene.elements.length, "split produces no duplicate ids");
assert.deepEqual(middleScene.elements.map((element) => element.kind), ["line", "freehand", "freehand", "rectangle", "ellipse", "arrow", "text"], "fragments stay at original z-order position");
assert.ok(middleFragments[0].points.at(-1).x < 200 && middleFragments[1].points[0].x > 200, "touched middle corridor is absent");

const startPlan = drawing.planDrawingFreehandPartialErase(drawing.createDrawingScene([original]), [{ x: 100, y: 100 }]);
const startScene = drawing.applyDrawingFreehandPartialErasePlan(drawing.createDrawingScene([original]), startPlan, makeIds());
assert.equal(startScene.elements.length, 1);
assert.ok(startScene.elements[0].points[0].x > 100, "start erase trims start only");

const endPlan = drawing.planDrawingFreehandPartialErase(drawing.createDrawingScene([original]), [{ x: 300, y: 100 }]);
const endScene = drawing.applyDrawingFreehandPartialErasePlan(drawing.createDrawingScene([original]), endPlan, makeIds());
assert.equal(endScene.elements.length, 1);
assert.ok(endScene.elements[0].points.at(-1).x < 300, "end erase trims end only");

const shortStroke = freehand("stroke:short", [{ x: 100, y: 100 }, { x: 120, y: 100 }]);
const fullPlan = drawing.planDrawingFreehandPartialErase(drawing.createDrawingScene([shortStroke]), [{ x: 110, y: 100 }]);
const fullScene = drawing.applyDrawingFreehandPartialErasePlan(drawing.createDrawingScene([shortStroke]), fullPlan, makeIds());
assert.equal(fullScene.elements.length, 0, "fully covered freehand is removed");

const sweptPlan = drawing.planDrawingFreehandPartialErase(
  drawing.createDrawingScene([original]),
  [{ x: 200, y: 20 }, { x: 200, y: 180 }],
);
assert.equal(sweptPlan.changed, true, "swept corridor catches a crossing between pointer samples");
assert.equal(sweptPlan.replacements[0].fragments.length, 2);

const nonFreehand = drawing.createDrawingScene([line, rectangle, ellipse, arrow, text]);
const nonFreehandBefore = drawing.serializeDrawingScene(nonFreehand);
const nonFreehandPlan = drawing.planDrawingFreehandPartialErase(nonFreehand, [{ x: 200, y: 220 }, { x: 200, y: 800 }]);
assert.equal(nonFreehandPlan.changed, false, "eraser ignores all non-freehand kinds");
assert.strictEqual(drawing.applyDrawingFreehandPartialErasePlan(nonFreehand, nonFreehandPlan, makeIds()), nonFreehand, "non-freehand no-hit returns same Scene");
assert.equal(drawing.serializeDrawingScene(nonFreehand), nonFreehandBefore);

const noHitPlan = drawing.planDrawingFreehandPartialErase(mixed, [{ x: 900, y: 1_300 }]);
assert.equal(noHitPlan.changed, false, "no-hit gesture mutation 0");
assert.strictEqual(drawing.applyDrawingFreehandPartialErasePlan(mixed, noHitPlan, makeIds()), mixed);

const twoStrokes = drawing.createDrawingScene([
  freehand("stroke:first", [{ x: 100, y: 100 }, { x: 300, y: 100 }]),
  line,
  freehand("stroke:second", [{ x: 100, y: 140 }, { x: 300, y: 140 }]),
]);
const multiPlan = drawing.planDrawingFreehandPartialErase(twoStrokes, [{ x: 200, y: 60 }, { x: 200, y: 180 }]);
assert.equal(multiPlan.replacements.length, 2, "one swept gesture can affect multiple freehand strokes");
let history = drawing.createDrawingSceneHistory(twoStrokes);
history = drawing.commitDrawingScene(history, drawing.applyDrawingFreehandPartialErasePlan(twoStrokes, multiPlan, makeIds()));
assert.equal(history.past.length, 1, "one eraser gesture one history commit");
const postErase = history.current;
history = drawing.undoDrawingScene(history);
assert.deepEqual(history.current, twoStrokes, "Undo restores exact original ids/order/geometry");
history = drawing.redoDrawingScene(history);
assert.deepEqual(history.current, postErase, "Redo restores exact fragment Scene");

const tinyEdge = freehand("stroke:tiny-edge", [{ x: 100, y: 100 }, { x: 200, y: 100 }]);
const tinyPlan = drawing.planDrawingFreehandPartialErase(drawing.createDrawingScene([tinyEdge]), [{ x: 115, y: 100 }]);
const tinyScene = drawing.applyDrawingFreehandPartialErasePlan(drawing.createDrawingScene([tinyEdge]), tinyPlan, makeIds());
assert.equal(tinyScene.elements.length, 1, "deterministic minimum drops a sub-1.5 WORLD degenerate fragment");
assert.equal(drawing.DRAWING_ERASER_FRAGMENT_MIN_WORLD_LENGTH, drawing.DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE);
assert.equal(drawing.DRAWING_PARTIAL_ERASER_RADIUS_WORLD, drawing.DRAWING_HIT_TEST_TOLERANCE_WORLD, "ring and partial erase share one WORLD radius");

assert.match(eraserSource, /segmentCapsuleIntervals/u, "domain uses swept capsule/corridor geometry");
assert.match(eraserSource, /radius \+ strokeWidth \/ 2/u, "visible stroke width participates in corridor intersection");
assert.doesNotMatch(eraserSource, /from ["'](?:react|react-native|expo)|screenPixel|devicePixel/iu, "partial eraser is framework/device independent");
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.doesNotMatch(contracts, /eraser|fragment/u, "Scene schema has no eraser/fragment kind or state");

assert.match(editor, /work-order-sketch-compact-toolbar/u);
assert.match(editor, /work-order-sketch-drawing-tool-selector/u);
assert.match(editor, /work-order-sketch-drawing-tool-menu/u);
for (const label of ["펜", "선", "화살표", "사각형", "타원", "텍스트"]) {
  assert.match(editor, new RegExp(`${label}`, "u"), `drawing menu contains ${label}`);
}
for (const testId of ["selection-tool", "eraser-tool", "undo", "redo", "delete-selected", "clear-all"]) {
  assert.match(editor, new RegExp(`work-order-sketch-${testId}`, "u"));
}
assert.match(editor, /accessibilityLabel="선택 객체 삭제"/u);
assert.match(editor, /accessibilityLabel="전체 지우기"/u);
assert.match(editor, /<Trash2[^>]+/u, "selected-object Delete uses trash semantics");
assert.match(editor, /<BrushCleaning[^>]+/u, "Clear All uses a distinct installed icon");
assert.doesNotMatch(editor, /label="(?:펜|선|화살표|사각형|타원|텍스트|선택|지우개|Undo|Redo|삭제|Clear)"/u, "top-level toolbar has no text-heavy Tool labels");
assert.match(editor, /accessibilityRole="button"/u);
assert.match(editor, /minHeight: WAFL_THEME\.touch\.minimum/u);
assert.match(editor, /setDrawingToolMenuVisible\(false\)[\s\S]*if \(next === toolRef\.current\) return/u, "tool choice closes menu even when reselecting current tool");
assert.match(editor, /if \(isAuthoringTool\(next\)\) setLastAuthoringTool\(next\)/u);
assert.match(editor, /displayedScene = eraserPreviewScene \?\? currentScene/u, "partial preview renders without canonical Scene mutation");
assert.match(editor, /onPanResponderMove:[\s\S]*extendEraserGesture/u);
assert.match(editor, /onPanResponderRelease:[\s\S]*commitEraserGesture/u);
assert.doesNotMatch(editor, /eraserCandidateIds|projectDrawingEraserCandidateOutline|appendDrawingEraserTarget/u, "whole-object Eraser candidate semantics are removed");
assert.doesNotMatch(projection, /eraser-candidate|projectDrawingEraserCandidateOutline/u);
assert.match(projection, /resolveDrawingEraserCursorScreenRadius\([\s\S]*worldRadius[\s\S]*transform\.scale[\s\S]*0/u, "ring exactly projects the actual WORLD erase radius");
assert.match(packageJson, /"lucide-react-native": "\^1\.24\.0"/u, "existing Lucide dependency retained");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha75-partial-eraser-compact-toolbar",
  previousPermanentInventoryRetained: 275,
  addedPermanentChecks: 1,
  finalPermanentInventory: 276,
  sceneSchemaVersion: 1,
  apiDelta: 0,
  migrationDelta: 0,
  dependencyDelta: 0,
  nativeDelta: 0,
  physicalResultInferred: false,
  freehandOnlyProductPolicySupersededBy: "workorder-v2-alpha75-overlay-palette-stroke-partial-eraser",
}));

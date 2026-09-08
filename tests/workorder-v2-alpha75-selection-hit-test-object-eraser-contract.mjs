#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a75-hit-test-"));
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
const contracts = read("lib/domain/drawing/contracts.ts");
const hitTestSource = read("lib/domain/drawing/hitTest.ts");
const style = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 4 });

const freehand = Object.freeze({ id: "freehand:1", kind: "freehand", points: [{ x: 100, y: 100 }, { x: 300, y: 100 }], style });
const line = Object.freeze({ id: "line:1", kind: "line", start: { x: 100, y: 220 }, end: { x: 300, y: 220 }, style });
const arrow = Object.freeze({ id: "arrow:1", kind: "arrow", start: { x: 100, y: 340 }, end: { x: 300, y: 340 }, style });
const rectangle = Object.freeze({ id: "rectangle:1", kind: "rectangle", bounds: { x: 100, y: 440, width: 240, height: 150 }, style });
const ellipse = Object.freeze({ id: "ellipse:1", kind: "ellipse", bounds: { x: 100, y: 660, width: 240, height: 120 }, style });
const text = Object.freeze({ id: "text:1", kind: "text", anchor: { x: 100, y: 920 }, content: "포켓 2cm 위", fontSize: 34, style });
const mixed = drawing.createDrawingScene([freehand, line, arrow, rectangle, ellipse, text]);

assert.equal(drawing.hitTestDrawingElement(freehand, { x: 180, y: 108 }), true, "freehand visible path hit");
assert.equal(drawing.hitTestDrawingElement(freehand, { x: 180, y: 140 }), false, "freehand miss");
assert.equal(drawing.hitTestDrawingElement(line, { x: 210, y: 228 }), true, "line segment hit");
assert.equal(drawing.hitTestDrawingElement(line, { x: 210, y: 260 }), false, "line miss");
assert.equal(drawing.hitTestDrawingElement(arrow, { x: 170, y: 348 }), true, "arrow shaft hit");
const arrowHead = drawing.resolveDrawingArrowHeadWorldGeometry(arrow.start, arrow.end, arrow.style.strokeWidth);
assert.equal(drawing.hitTestDrawingElement(arrow, {
  x: (arrowHead.left.x + arrowHead.tip.x) / 2,
  y: (arrowHead.left.y + arrowHead.tip.y) / 2,
}), true, "arrowhead hit");
assert.equal(drawing.hitTestDrawingElement(rectangle, { x: 105, y: 500 }), true, "rectangle visible border hit");
assert.equal(drawing.hitTestDrawingElement(rectangle, { x: 220, y: 515 }), false, "unfilled rectangle deep interior miss");
assert.equal(drawing.hitTestDrawingElement(ellipse, { x: 338, y: 720 }), true, "ellipse visible border hit");
assert.equal(drawing.hitTestDrawingElement(ellipse, { x: 220, y: 720 }), false, "unfilled ellipse deep interior miss");
const textBounds = drawing.resolveDrawingTextSemanticBounds(text);
assert.equal(drawing.hitTestDrawingElement(text, { x: textBounds.x + 8, y: textBounds.y + 8 }), true, "text semantic bounds hit");
assert.equal(drawing.hitTestDrawingElement(text, { x: 450, y: 920 }), false, "text semantic bounds miss");

const below = Object.freeze({ ...line, id: "line:below", start: { x: 100, y: 1_050 }, end: { x: 300, y: 1_050 } });
const above = Object.freeze({ ...line, id: "line:above", start: { x: 100, y: 1_050 }, end: { x: 300, y: 1_050 } });
const overlap = drawing.createDrawingScene([below, above]);
assert.equal(drawing.hitTestDrawingSceneTopmost(overlap, { x: 200, y: 1_050 })?.id, "line:above", "latest/topmost wins");
assert.equal(drawing.hitTestDrawingSceneTopmost(mixed, { x: 900, y: 1_300 }), null, "empty canvas returns none");
assert.equal(drawing.DRAWING_HIT_TEST_TOLERANCE_WORLD, 12, "one deterministic WORLD tolerance");
assert.equal(drawing.hitTestDrawingElement(line, { x: 200, y: 234 }, 12), true, "WORLD tolerance is viewport-independent input");
assert.equal(drawing.hitTestDrawingElement(line, { x: 200, y: 238 }, 12), false, "WORLD tolerance has deterministic boundary");

const serializedBeforeSelection = drawing.serializeDrawingScene(overlap);
let history = drawing.createDrawingSceneHistory(overlap);
const selected = drawing.hitTestDrawingSceneTopmost(history.current, { x: 200, y: 1_050 });
assert.equal(selected?.id, "line:above");
assert.equal(drawing.serializeDrawingScene(history.current), serializedBeforeSelection, "selection Scene mutation 0");
assert.equal(history.past.length, 0, "selection history mutation 0");
assert.equal(JSON.stringify(history.current).includes("selected"), false, "selection is not persisted");

const deletedScene = drawing.removeDrawingElementsById(history.current, new Set([selected.id]));
history = drawing.commitDrawingScene(history, deletedScene);
assert.deepEqual(history.current.elements.map((element) => element.id), ["line:below"], "delete exact selected id");
assert.equal(history.past.length, 1, "delete one history commit");
history = drawing.undoDrawingScene(history);
assert.deepEqual(history.current.elements.map((element) => element.id), ["line:below", "line:above"], "Undo restores exact z-order");
history = drawing.redoDrawingScene(history);
assert.deepEqual(history.current.elements.map((element) => element.id), ["line:below"], "Redo removes selected object again");

for (const element of mixed.elements) {
  const removed = drawing.removeDrawingElementsById(mixed, new Set([element.id]));
  assert.equal(removed.elements.some((candidate) => candidate.id === element.id), false, `Selection + Delete removes whole ${element.kind}`);
  assert.equal(removed.elements.length, mixed.elements.length - 1, `Selection + Delete removes exactly one ${element.kind}`);
}
assert.strictEqual(drawing.removeDrawingElementsById(mixed, new Set()), mixed, "empty Delete mutation 0");

for (const label of ["펜", "선", "화살표", "사각형", "타원", "텍스트"]) {
  assert.match(editor, new RegExp(`"${label}"`, "u"), `${label} remains available in the compact authoring menu`);
}
assert.match(editor, /testID="work-order-sketch-selection-tool"/u);
assert.match(editor, /testID="work-order-sketch-eraser-tool"/u);
assert.match(editor, /selectedElementId/u);
assert.match(editor, /projectDrawingSelectionOutline/u);
assert.match(editor, /commitEraserGesture/u);
assert.match(editor, /removeDrawingElementsById/u);
assert.match(editor, /accessibilityLabel="선택 객체 삭제"/u);
assert.match(projection, /projectDrawingSelectionOutline/u);
assert.match(projection, /resolveDrawingArrowHeadWorldGeometry/u);
assert.match(hitTestSource, /for \(let index = scene\.elements\.length - 1; index >= 0; index -= 1\)/u);
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
for (const forbidden of ["이동", "크기조절", "회전", "확대", "이미지", "연필"]) {
  assert.doesNotMatch(editor, new RegExp(`label="${forbidden}"`, "u"));
}
assert.doesNotMatch(hitTestSource, /from ["'](?:react|expo)|react-native|DrawingViewport|screenPixel|devicePixel/iu, "hit-test foundation has no UI/device dependency");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha75-selection-hit-test-object-delete",
  previousPermanentInventoryRetained: 273,
  addedPermanentChecks: 1,
  finalPermanentInventory: 274,
  assertionsMinimum: 30,
  sceneSchemaVersion: 1,
  migrationDelta: 0,
  wholeObjectEraserSemanticsSupersededBy: "workorder-v2-alpha75-partial-eraser-compact-toolbar",
  physicalResultInferred: false,
}));

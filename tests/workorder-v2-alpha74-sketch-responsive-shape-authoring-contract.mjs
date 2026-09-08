#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a74-shapes-"));
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
const renderer = read("apps/mobile/features/drawing-poc/SvgDrawingSceneRenderer.tsx");
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");
const annotationStyle = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 3 });

function shape(kind, start, end, id = `${kind}:fixture`) {
  return drawing.finalizeDrawingActiveShape(drawing.updateDrawingActiveShape(
    drawing.beginDrawingActiveShape({ id, kind, point: start, style: annotationStyle }),
    end,
  ));
}

const expectedBounds = { x: 100, y: 200, width: 300, height: 400 };
const directions = [
  [{ x: 100, y: 200 }, { x: 400, y: 600 }],
  [{ x: 400, y: 200 }, { x: 100, y: 600 }],
  [{ x: 100, y: 600 }, { x: 400, y: 200 }],
  [{ x: 400, y: 600 }, { x: 100, y: 200 }],
];
for (const kind of ["rectangle", "ellipse"]) {
  for (const [start, end] of directions) {
    const element = shape(kind, start, end);
    assert.ok(element);
    assert.deepEqual(element.bounds, expectedBounds, `${kind} must normalize every drag direction in WORLD space`);
  }
}

const clamped = shape("rectangle", { x: -50, y: -40 }, { x: 1_250, y: 1_600 });
assert.ok(clamped);
assert.deepEqual(clamped.bounds, { x: 0, y: 0, width: 1_000, height: 1_400 });
assert.equal(shape("rectangle", { x: 10, y: 10 }, { x: 11, y: 100 }), null);
assert.equal(shape("ellipse", { x: 10, y: 10 }, { x: 100, y: 11 }), null);

const active = drawing.beginDrawingActiveShape({ id: "rectangle:transient", kind: "rectangle", point: { x: 20, y: 30 }, style: annotationStyle });
const moved = drawing.updateDrawingActiveShape(active, { x: 220, y: 330 });
assert.deepEqual(active.end, { x: 20, y: 30 });
assert.deepEqual(moved.end, { x: 220, y: 330 });
assert.equal(drawing.cancelDrawingActiveShape(), null);

const rectangle = shape("rectangle", { x: 80, y: 120 }, { x: 360, y: 520 }, "rectangle:1");
const ellipse = shape("ellipse", { x: 720, y: 960 }, { x: 420, y: 640 }, "ellipse:1");
assert.ok(rectangle && ellipse);
let history = drawing.createDrawingSceneHistory(drawing.createDrawingScene());
for (const element of [rectangle, ellipse]) {
  const before = history;
  history = drawing.commitDrawingScene(history, drawing.createDrawingScene([...history.current.elements, element]));
  assert.equal(history.past.length, before.past.length + 1, "release commits exactly one history entry");
}

const pen = drawing.finalizeDrawingActiveStroke(drawing.beginDrawingActiveStroke({ id: "pen:1", point: { x: 30, y: 40 }, style: annotationStyle }));
const line = drawing.finalizeDrawingActiveSegment(drawing.updateDrawingActiveSegment(drawing.beginDrawingActiveSegment({ id: "line:1", kind: "line", point: { x: 100, y: 100 }, style: annotationStyle }), { x: 200, y: 220 }));
const arrow = drawing.finalizeDrawingActiveSegment(drawing.updateDrawingActiveSegment(drawing.beginDrawingActiveSegment({ id: "arrow:1", kind: "arrow", point: { x: 300, y: 300 }, style: annotationStyle }), { x: 500, y: 480 }));
const text = drawing.createDrawingTextElement({ id: "text:1", anchor: { x: 250, y: 700 }, content: "3cm 줄임", style: annotationStyle });
assert.ok(line && arrow && text);
history = drawing.createDrawingSceneHistory(drawing.createDrawingScene());
for (const element of [pen, line, arrow, text, rectangle, ellipse]) {
  history = drawing.commitDrawingScene(history, drawing.createDrawingScene([...history.current.elements, element]));
}
const mixedSerialized = drawing.serializeDrawingScene(history.current);
assert.deepEqual(drawing.parseDrawingScene(mixedSerialized), history.current);
for (let index = 0; index < 6; index += 1) history = drawing.undoDrawingScene(history);
assert.equal(history.current.elements.length, 0);
for (let index = 0; index < 6; index += 1) history = drawing.redoDrawingScene(history);
assert.equal(drawing.serializeDrawingScene(history.current), mixedSerialized);

const camera = drawing.createDrawingCamera();
for (const viewport of [{ width: 390, height: 560 }, { width: 820, height: 1_100 }, { width: 1_180, height: 760 }]) {
  for (const point of [{ x: rectangle.bounds.x, y: rectangle.bounds.y }, { x: rectangle.bounds.x + rectangle.bounds.width, y: rectangle.bounds.y + rectangle.bounds.height }]) {
    const projected = drawing.worldToScreen(point, camera, viewport);
    const restored = drawing.screenToWorld(projected, camera, viewport);
    assert.ok(Math.abs(restored.x - point.x) < 1e-9 && Math.abs(restored.y - point.y) < 1e-9);
  }
  assert.equal(drawing.serializeDrawingScene(history.current), mixedSerialized, "viewport changes cannot mutate canonical Scene bytes");
}
for (let index = 0; index < 10; index += 1) {
  const viewport = index % 2 === 0 ? { width: 820, height: 1_100 } : { width: 1_180, height: 760 };
  drawing.resolveDrawingViewportTransform(camera, viewport);
  assert.equal(drawing.serializeDrawingScene(history.current), mixedSerialized, "repeated orientation changes cannot drift WORLD geometry");
}

assert.equal(drawing.isDrawingAuthoringViewportGenerationCurrent(7, 7), true);
assert.equal(drawing.isDrawingAuthoringViewportGenerationCurrent(7, 8), false);
assert.equal(drawing.isDrawingAuthoringViewportGenerationCurrent(null, 8), false);

for (const label of ["펜", "선", "화살표", "사각형", "타원", "텍스트"]) {
  assert.match(editor, new RegExp(`"${label}"`, "u"), `${label} remains available after compact-toolbar migration`);
}
for (const hidden of ["이동", "크기조절", "이미지", "연필"]) {
  assert.doesNotMatch(editor, new RegExp(`label="${hidden}"`, "u"));
}
assert.match(editor, /activeGestureViewportGenerationRef/u);
assert.match(editor, /viewportGenerationRef\.current \+= 1;[\s\S]*discardActiveGesture\(\)/u);
assert.match(editor, /if \(!activeGestureUsesCurrentViewport\(\)\) \{[\s\S]*discardActiveGesture\(\);[\s\S]*return;/u);
assert.match(editor, /textSessionRef\.current !== null\) cancelText\(\)/u);
assert.match(editor, /drawingToolMenu: \{[^}]*position: "absolute"/u, "alpha.75 supersedes the normal-flow wrapping menu with an overlay palette");
assert.match(editor, /drawingToolMenuItem: \{[^}]*minHeight: WAFL_THEME\.touch\.minimum/u);
assert.match(renderer, /primitive\.kind === "rectangle"[\s\S]*<Rect/u);
assert.match(renderer, /<Ellipse/u);
assert.match(projection, /kind: element\.kind[\s\S]*width: element\.bounds\.width \* transform\.scale[\s\S]*height: element\.bounds\.height \* transform\.scale/u);
assert.doesNotMatch(editor, /Skia|react-native-reanimated|react-native-gesture-handler|screenY|modelName|keyboardHeight/iu);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha74-sketch-responsive-shape-authoring",
  previousPermanentInventoryRetained: 265,
  addedPermanentChecks: 1,
  normalFlowToolMenuSupersededBy: "workorder-v2-alpha75-overlay-palette-stroke-partial-eraser",
  finalPermanentInventory: 266,
  shapeTools: ["rectangle", "ellipse"],
  viewportGenerationGuard: true,
  schemaVersion: 1,
  migrationDelta: 0,
  physicalResultInferred: false,
}));

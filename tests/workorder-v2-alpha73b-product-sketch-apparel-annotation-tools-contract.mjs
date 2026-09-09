#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a73b-drawing-"));
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
    "lib/domain/drawing/contracts.ts",
    "lib/domain/drawing/authoring.ts",
    "lib/domain/drawing/scene.ts",
    "lib/domain/drawing/history.ts",
    "lib/domain/drawing/viewport.ts",
  ], { cwd: process.cwd(), stdio: "pipe" });
} catch (error) {
  fs.rmSync(compiledDirectory, { recursive: true, force: true });
  throw error;
}
process.on("exit", () => fs.rmSync(compiledDirectory, { recursive: true, force: true }));
const require = createRequire(import.meta.url);
const {
  beginDrawingActiveSegment,
  beginDrawingActiveStroke,
  cancelDrawingActiveSegment,
  createDrawingTextElement,
  finalizeDrawingActiveSegment,
  finalizeDrawingActiveStroke,
  updateDrawingActiveSegment,
} = require(path.join(compiledDirectory, "authoring.js"));
const { DRAWING_TEXT_DEFAULT_FONT_SIZE, DRAWING_TEXT_MAX_LENGTH } = require(path.join(compiledDirectory, "contracts.js"));
const { commitDrawingScene, createDrawingSceneHistory, redoDrawingScene, undoDrawingScene } = require(path.join(compiledDirectory, "history.js"));
const { createDrawingScene, parseDrawingScene, serializeDrawingScene, validateDrawingScene } = require(path.join(compiledDirectory, "scene.js"));
const { createDrawingCamera, resolveDrawingViewportTransform, screenToWorld, worldToScreen } = require(path.join(compiledDirectory, "viewport.js"));

const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const renderer = read("apps/mobile/features/drawing-poc/SvgDrawingSceneRenderer.tsx");
const route = read("lib/domain/work-orders/drawing/drawingRoute.ts");
const migration = read("db/v2/migrations/022_v2_work_order_drawings.sql");

const penStyle = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 4 });
const annotationStyle = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 3 });
const assertPointClose = (actual, expected) => {
  assert.ok(Math.abs(actual.x - expected.x) < 1e-9);
  assert.ok(Math.abs(actual.y - expected.y) < 1e-9);
};

// Legacy schemaVersion 1 payloads remain readable without a DB migration or stored-row rewrite.
const legacy = createDrawingScene([
  finalizeDrawingActiveStroke(beginDrawingActiveStroke({ id: "legacy:pen", point: { x: 12, y: 24 }, style: penStyle })),
]);
assert.deepEqual(parseDrawingScene(serializeDrawingScene(legacy)), legacy);
assert.match(migration, /schema_version integer NOT NULL/u);
assert.match(migration, /schema_version = 1/u);

// Segment authoring is WORLD-space and transient updates do not touch Scene/history.
const initialHistory = createDrawingSceneHistory(legacy);
const lineTransient = updateDrawingActiveSegment(
  beginDrawingActiveSegment({ id: "line:1", kind: "line", point: { x: 100, y: 200 }, style: annotationStyle }),
  { x: 450, y: 700 },
);
assert.equal(initialHistory.current.elements.length, 1);
assert.equal(initialHistory.past.length, 0);
const line = finalizeDrawingActiveSegment(lineTransient);
assert.ok(line);
assert.deepEqual(line.start, { x: 100, y: 200 });
assert.deepEqual(line.end, { x: 450, y: 700 });
assert.equal(finalizeDrawingActiveSegment(updateDrawingActiveSegment(lineTransient, { x: 100.5, y: 200.5 })), null);
assert.equal(cancelDrawingActiveSegment(), null);

const arrow = finalizeDrawingActiveSegment(updateDrawingActiveSegment(
  beginDrawingActiveSegment({ id: "arrow:1", kind: "arrow", point: { x: 800, y: 900 }, style: annotationStyle }),
  { x: 200, y: 300 },
));
assert.ok(arrow);
assert.deepEqual(arrow.start, { x: 800, y: 900 });
assert.deepEqual(arrow.end, { x: 200, y: 300 });

// Projection is deterministic across viewport sizes; semantic endpoints never change.
for (const viewport of [{ width: 320, height: 480 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
  const transform = resolveDrawingViewportTransform(createDrawingCamera(), viewport);
  assert.ok(transform.scale > 0);
  assertPointClose(screenToWorld(worldToScreen(line.start, createDrawingCamera(), viewport), createDrawingCamera(), viewport), line.start);
  assertPointClose(screenToWorld(worldToScreen(line.end, createDrawingCamera(), viewport), createDrawingCamera(), viewport), line.end);
  assertPointClose(screenToWorld(worldToScreen(arrow.start, createDrawingCamera(), viewport), createDrawingCamera(), viewport), arrow.start);
  assertPointClose(screenToWorld(worldToScreen(arrow.end, createDrawingCamera(), viewport), createDrawingCamera(), viewport), arrow.end);
}

const text = createDrawingTextElement({
  id: "text:1",
  anchor: { x: 222, y: 444 },
  content: "  포켓 2cm 위 / stitch #2  ",
  style: annotationStyle,
});
assert.ok(text);
assert.equal(text.content, "포켓 2cm 위 / stitch #2");
assert.equal(text.fontSize, DRAWING_TEXT_DEFAULT_FONT_SIZE);
assert.deepEqual(text.anchor, { x: 222, y: 444 });
assert.equal(createDrawingTextElement({ id: "text:empty", anchor: { x: 1, y: 1 }, content: " \t ", style: annotationStyle }), null);
assert.equal(createDrawingTextElement({ id: "text:long", anchor: { x: 1, y: 1 }, content: "가".repeat(DRAWING_TEXT_MAX_LENGTH + 1), style: annotationStyle }), null);

// Mixed history commits exactly once per completed tool and restores exact IDs/order.
let history = createDrawingSceneHistory(createDrawingScene());
for (const element of [legacy.elements[0], line, arrow, text]) {
  history = commitDrawingScene(history, createDrawingScene([...history.current.elements, element]));
}
assert.deepEqual(history.current.elements.map((element) => element.id), ["legacy:pen", "line:1", "arrow:1", "text:1"]);
const mixedSerialized = serializeDrawingScene(history.current);
assert.equal(validateDrawingScene(JSON.parse(mixedSerialized)).ok, true);
assert.deepEqual(parseDrawingScene(mixedSerialized), history.current);
for (let index = 0; index < 4; index += 1) history = undoDrawingScene(history);
assert.equal(history.current.elements.length, 0);
for (let index = 0; index < 4; index += 1) history = redoDrawingScene(history);
assert.equal(serializeDrawingScene(history.current), mixedSerialized);
const cleared = commitDrawingScene(history, createDrawingScene());
assert.equal(cleared.current.elements.length, 0);
assert.equal(serializeDrawingScene(undoDrawingScene(cleared).current), mixedSerialized);

// Product controls and child-sheet close ownership remain explicit and bounded.
for (const label of ["펜", "선", "화살표", "텍스트"]) {
  assert.match(editor, new RegExp(`"${label}"`, "u"), `${label} remains available after compact-toolbar migration`);
}
// Later bounded Product Sketch increments may add shapes and object editing; alpha.73 still guards unrelated transforms/media.
for (const hidden of ["원", "이동", "크기조절", "이미지"]) assert.doesNotMatch(editor, new RegExp(`label="${hidden}"`, "u"));
assert.match(
  editor,
  /onPanResponderTerminate:[\s\S]*cameraInputActiveRef\.current \|\| suppressOneFingerUntilReleaseRef\.current\) return;[\s\S]*cancelAllTransientGestures\(\)/u,
  "one-finger authoring termination remains canonical while raw Camera owns multi-touch suppression",
);
assert.match(editor, /onAfterClose=\{completeTextSheetClose\}/u);
assert.match(editor, /pendingTextCommitRef\.current = Object\.freeze\(\{ element, sessionId: session\.id \}\);[\s\S]*setTextSheetVisible\(false\)/u);
const textCloseBody = editor.match(/function completeTextSheetClose\(\) \{([\s\S]*?)\n  \}/u)?.[1] ?? "";
assert.ok(textCloseBody);
assert.doesNotMatch(textCloseBody, /props\.onClose|closeEditorSession/u);
assert.match(renderer, /Text as SvgText/u);
assert.match(read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts"), /resolveDrawingArrowHeadWorldGeometry[\s\S]*function arrowPath[\s\S]*pathFromPoints\(\[start, end\]\)/u);
assert.match(route, /validateDrawingScene/u);
assert.doesNotMatch(editor, /setInterval|autoSave|autosave/iu);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha73b-product-sketch-apparel-annotation-tools",
  previousPermanentInventoryRetained: 230,
  addedPermanentChecks: 1,
  finalPermanentInventory: 231,
  schemaStrategy: "additive-v1-element-kind",
  textInput: "single-line-120-characters",
  mixedRoundTrip: true,
  productionMutation: 0,
  physicalResultInferred: false,
}));

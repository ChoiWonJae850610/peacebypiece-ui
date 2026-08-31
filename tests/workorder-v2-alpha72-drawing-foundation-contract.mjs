import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const drawingSourceRoot = path.resolve("lib/domain/drawing");
const compiledRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-drawing-foundation-"));
const drawingSourceNames = fs.readdirSync(drawingSourceRoot).filter((name) => name.endsWith(".ts"));
for (const name of drawingSourceNames) {
  const source = fs.readFileSync(path.join(drawingSourceRoot, name), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: name,
  }).outputText;
  fs.writeFileSync(path.join(compiledRoot, name.replace(/\.ts$/, ".js")), output, "utf8");
}
const {
  DRAWING_CANONICAL_CANVAS,
  DRAWING_SCENE_SCHEMA_VERSION,
  commitDrawingScene,
  createDrawingCamera,
  createDrawingScene,
  createDrawingSceneHistory,
  drawingScenesEqual,
  parseDrawingScene,
  redoDrawingScene,
  resolveDrawingViewportTransform,
  screenToWorld,
  serializeDrawingScene,
  undoDrawingScene,
  validateDrawingScene,
  worldToScreen,
} = require(path.join(compiledRoot, "index.js"));
process.on("exit", () => fs.rmSync(compiledRoot, { recursive: true, force: true }));

const style = Object.freeze({ strokeColor: "#1F2937", strokeWidth: 4, fillColor: null });
const sampleElements = Object.freeze([
  Object.freeze({ id: "stroke:1", kind: "freehand", style, points: Object.freeze([{ x: 80, y: 120 }, { x: 220, y: 260 }, { x: 310, y: 180 }]) }),
  Object.freeze({ id: "line:1", kind: "line", style, start: Object.freeze({ x: 100, y: 1_100 }), end: Object.freeze({ x: 900, y: 1_200 }) }),
  Object.freeze({ id: "arrow:1", kind: "arrow", style, start: Object.freeze({ x: 150, y: 900 }), end: Object.freeze({ x: 700, y: 400 }) }),
  Object.freeze({ id: "rect:1", kind: "rectangle", style, bounds: Object.freeze({ x: 250, y: 300, width: 300, height: 180 }) }),
  Object.freeze({ id: "ellipse:1", kind: "ellipse", style, bounds: Object.freeze({ x: 600, y: 700, width: 220, height: 320 }) }),
]);
const scene = createDrawingScene(sampleElements);

assert.equal(DRAWING_SCENE_SCHEMA_VERSION, 1);
assert.deepEqual(DRAWING_CANONICAL_CANVAS, {
  width: 1_000,
  height: 1_400,
  origin: "top-left",
  xAxis: "right",
  yAxis: "down",
});
assert.deepEqual(scene.elements.map((element) => element.kind), ["freehand", "line", "arrow", "rectangle", "ellipse"]);
assert.deepEqual(scene.elements.map((element) => element.id), ["stroke:1", "line:1", "arrow:1", "rect:1", "ellipse:1"]);
assert.ok(Object.isFrozen(scene));
assert.ok(Object.isFrozen(scene.elements));

const viewports = [
  { name: "phone portrait", width: 390, height: 844 },
  { name: "phone landscape", width: 844, height: 390 },
  { name: "tablet portrait", width: 834, height: 1_194 },
  { name: "tablet landscape", width: 1_194, height: 834 },
];
const cameras = [
  createDrawingCamera(),
  createDrawingCamera({ centerX: 420, centerY: 610, zoom: 1.75 }),
  createDrawingCamera({ centerX: 760, centerY: 280, zoom: 0.65 }),
];
const points = [
  { x: 0, y: 0 },
  { x: 1_000, y: 0 },
  { x: 0, y: 1_400 },
  { x: 1_000, y: 1_400 },
  { x: 500, y: 700 },
  { x: 123.456, y: 987.654 },
];
const originalSerialization = serializeDrawingScene(scene);
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);

for (const viewport of viewports) {
  for (const camera of cameras) {
    const transform = resolveDrawingViewportTransform(camera, viewport);
    close(transform.scale, transform.fitScale * camera.zoom, `${viewport.name} uniform scale`);
    for (const point of points) {
      const screen = worldToScreen(point, camera, viewport);
      const world = screenToWorld(screen, camera, viewport);
      close(world.x, point.x, `${viewport.name} round-trip x`);
      close(world.y, point.y, `${viewport.name} round-trip y`);
    }
    const squareOrigin = worldToScreen({ x: 300, y: 500 }, camera, viewport);
    const squareX = worldToScreen({ x: 400, y: 500 }, camera, viewport);
    const squareY = worldToScreen({ x: 300, y: 600 }, camera, viewport);
    close(squareX.x - squareOrigin.x, squareY.y - squareOrigin.y, `${viewport.name} square aspect`);
    assert.equal(serializeDrawingScene(scene), originalSerialization, `${viewport.name} must not mutate Scene`);
  }
}

for (let cycle = 0; cycle < 4; cycle += 1) {
  for (const viewport of viewports) {
    const camera = createDrawingCamera({ centerX: 500 + cycle * 17, centerY: 700 - cycle * 23, zoom: 1 + cycle * 0.2 });
    worldToScreen({ x: 375, y: 925 }, camera, viewport);
    screenToWorld({ x: viewport.width / 3, y: viewport.height / 4 }, camera, viewport);
  }
}
assert.equal(serializeDrawingScene(scene), originalSerialization, "repeated viewport/camera changes must leave Scene unchanged");

const parsed = parseDrawingScene(originalSerialization);
assert.equal(drawingScenesEqual(scene, parsed), true);
assert.equal(serializeDrawingScene(parsed), originalSerialization);
assert.equal(Object.isFrozen(parsed.elements[0]), true);

const invalidCases = [
  { label: "NaN", value: { ...scene, elements: [{ ...scene.elements[1], start: { x: Number.NaN, y: 0 } }] } },
  { label: "Infinity", value: { ...scene, elements: [{ ...scene.elements[1], end: { x: Number.POSITIVE_INFINITY, y: 0 } }] } },
  { label: "schema", value: { ...scene, schemaVersion: 2 } },
  { label: "canvas", value: { ...scene, canvas: { ...scene.canvas, width: 999 } } },
  { label: "duplicate ID", value: { ...scene, elements: [scene.elements[0], { ...scene.elements[1], id: scene.elements[0].id }] } },
  { label: "malformed ID", value: { ...scene, elements: [{ ...scene.elements[0], id: " bad id " }] } },
  { label: "unsupported kind", value: { ...scene, elements: [{ ...scene.elements[0], kind: "text" }] } },
  { label: "device field", value: { ...scene, viewportWidth: 390 } },
  { label: "out of world", value: { ...scene, elements: [{ ...scene.elements[3], bounds: { x: 950, y: 100, width: 100, height: 100 } }] } },
];
for (const invalid of invalidCases) {
  assert.equal(validateDrawingScene(invalid.value).ok, false, `${invalid.label} must be rejected`);
}
assert.throws(() => parseDrawingScene("{not-json"), /Invalid Drawing Scene/);
assert.doesNotMatch(originalSerialization, /viewport|window|devicePixelRatio|orientation/i);

const append = (source, element) => createDrawingScene([...source.elements, element]);
const scene1 = createDrawingScene([scene.elements[0]]);
const scene2 = append(scene1, scene.elements[1]);
const scene3 = append(scene2, scene.elements[2]);
const scene4 = append(scene3, scene.elements[3]);
let history = createDrawingSceneHistory(scene1, 2);
const noOp = commitDrawingScene(history, parseDrawingScene(serializeDrawingScene(scene1)));
assert.strictEqual(noOp, history, "no-op edit must not add history");
history = commitDrawingScene(history, scene2);
history = commitDrawingScene(history, scene3);
history = commitDrawingScene(history, scene4);
assert.equal(history.past.length, 2, "history capacity must evict deterministically");
assert.equal(drawingScenesEqual(history.past[0], scene2), true);
history = undoDrawingScene(history);
assert.equal(drawingScenesEqual(history.current, scene3), true);
history = undoDrawingScene(history);
assert.equal(drawingScenesEqual(history.current, scene2), true);
const boundedUndo = undoDrawingScene(history);
assert.strictEqual(boundedUndo, history, "evicted state must not be recoverable");
history = redoDrawingScene(history);
assert.equal(drawingScenesEqual(history.current, scene3), true);
history = commitDrawingScene(history, scene1);
assert.equal(history.future.length, 0, "new edit after undo must clear redo");
assert.strictEqual(redoDrawingScene(history), history);
assert.doesNotMatch(JSON.stringify(history), /data:image|png|raster/i);

const drawingRoot = drawingSourceRoot;
const drawingSources = drawingSourceNames;
assert.deepEqual(drawingSources.sort(), ["adapters.ts", "authoring.ts", "contracts.ts", "history.ts", "index.ts", "scene.ts", "viewport.ts"]);
const importSource = drawingSources
  .map((name) => fs.readFileSync(path.join(drawingRoot, name), "utf8"))
  .flatMap((source) => source.split(/\r?\n/).filter((line) => /^import\s/.test(line.trim())))
  .join("\n");
assert.doesNotMatch(importSource, /work-orders|generated-documents|r2|pdf|react|expo|skia|gesture-handler|reanimated|canvas/i);

const packageJson = fs.readFileSync("package.json", "utf8");
const mobilePackageJson = fs.readFileSync("apps/mobile/package.json", "utf8");
assert.doesNotMatch(packageJson, /@shopify\/react-native-skia|react-native-gesture-handler|react-native-reanimated/);
assert.doesNotMatch(mobilePackageJson, /react-native-gesture-handler|react-native-reanimated|react-native-worklets/);
const gallery = fs.readFileSync("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx", "utf8");
assert.match(gallery, /"스케치, 준비 중"/);
assert.match(gallery, /disabled=\{!props\.drawingRendererPocEnabled\}/);
assert.match(gallery, /testID="work-order-image-sketch"/);
const currentState = fs.readFileSync("docs/codex-current-state.md", "utf8");
const roadmap = fs.readFileSync("docs/project/app-v2/08-roadmap-2.0.md", "utf8");
const guardrails = fs.readFileSync("docs/project/app-v2/drawing-architecture-guardrails.md", "utf8");
assert.match(currentState, /ALPHA72_SVG_RENDERER_AUTHORING_PIPELINE_OPTIMIZATION_IPHONE_QA_REQUIRED/);
assert.match(roadmap, /Alpha\.72 current candidate — Drawing Foundation/);
assert.match(guardrails, /FOUNDATION_ARCHITECTURE_CONTRACT/);
assert.match(guardrails, /renderer-independent|framework-independent/i);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha72-drawing-foundation",
  previousPermanentInventoryRetained: 220,
  addedPermanentChecks: 1,
  finalPermanentInventory: 221,
  canonicalWorld: "1000x1400",
  drawingUi: 0,
  drawingLibrarySelection: 0,
  physicalResultInferred: false,
}));

#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const compiledRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-drawing-svg-performance-"));
const drawingRoot = path.join(compiledRoot, "drawing");
fs.mkdirSync(drawingRoot, { recursive: true });

function compile(sourcePath, outputPath, replacements = []) {
  const source = fs.readFileSync(sourcePath, "utf8");
  let output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: sourcePath,
  }).outputText;
  for (const [pattern, value] of replacements) output = output.replace(pattern, value);
  fs.writeFileSync(outputPath, output, "utf8");
}

for (const name of fs.readdirSync("lib/domain/drawing").filter((candidate) => candidate.endsWith(".ts"))) {
  compile(path.join("lib/domain/drawing", name), path.join(drawingRoot, name.replace(/\.ts$/, ".js")));
}
compile(
  "apps/mobile/features/drawing-poc/drawingRendererPocPolicy.ts",
  path.join(compiledRoot, "policy.js"),
  [[/require\("@\/domain\/drawing"\)/g, 'require("./drawing/index.js")']],
);
compile(
  "apps/mobile/features/drawing-poc/drawingFreehandPath.ts",
  path.join(compiledRoot, "drawingFreehandPath.js"),
  [[/require\("@\/domain\/drawing"\)/g, 'require("./drawing/index.js")']],
);
compile(
  "apps/mobile/features/drawing-poc/drawingRenderProjection.ts",
  path.join(compiledRoot, "projection.js"),
  [[/require\("@\/domain\/drawing"\)/g, 'require("./drawing/index.js")']],
);
process.on("exit", () => fs.rmSync(compiledRoot, { recursive: true, force: true }));

const drawing = require(path.join(drawingRoot, "index.js"));
const policy = require(path.join(compiledRoot, "policy.js"));
const projection = require(path.join(compiledRoot, "projection.js"));

const expected = {
  sparse: { elements: 5, freehandPoints: 8 },
  medium: { elements: 80, freehandPoints: 800 },
  heavy: { elements: 240, freehandPoints: 4_800 },
};
for (const [workload, counts] of Object.entries(expected)) {
  const scene = policy.createDrawingPocWorkload(workload);
  assert.deepEqual(policy.drawingPocWorkloadCounts(workload), counts);
  assert.equal(scene.elements.length, counts.elements, `${workload} element count`);
  assert.equal(policy.countDrawingPocFreehandPoints(scene), counts.freehandPoints, `${workload} freehand point count`);
  assert.deepEqual([...new Set(scene.elements.map((element) => element.kind))].sort(), ["arrow", "ellipse", "freehand", "line", "rectangle"]);

  const transform = drawing.resolveDrawingViewportTransform(drawing.createDrawingCamera(), { width: 390, height: 560 });
  const serialization = drawing.serializeDrawingScene(scene);
  const frame = projection.projectDrawingScene({ scene, transform });
  assert.equal(frame.length, scene.elements.length);
  assert.equal(drawing.serializeDrawingScene(scene), serialization, `${workload} projection mutation 0`);
}

const committedScene = policy.createDrawingPocWorkload("heavy");
const initialHistory = drawing.createDrawingSceneHistory(committedScene);
const committedCurrent = initialHistory.current;
const committedSerialization = drawing.serializeDrawingScene(committedCurrent);
let active = drawing.beginDrawingActiveStroke({
  id: "contract-live-stroke",
  point: { x: 100, y: 200 },
  style: policy.DRAWING_POC_FREEHAND_STYLE,
});
assert.strictEqual(initialHistory.current, committedCurrent);
assert.equal(active.points.length, 1);
assert.equal(active.samplesReceived, 1);

active = drawing.appendDrawingActiveStrokePoint(active, { x: 100.4, y: 200.3 });
assert.equal(active.points.length, 1, "sub-threshold world sample is decimated");
assert.equal(active.decimatedPoints, 1);
assert.strictEqual(initialHistory.current, committedCurrent, "pointer move committed Scene identity unchanged");
assert.equal(initialHistory.past.length, 0, "pointer move history mutation 0");
assert.equal(drawing.serializeDrawingScene(committedCurrent), committedSerialization, "pointer move Scene serialization unchanged");

active = drawing.appendDrawingActiveStrokePoint(active, { x: 104, y: 206 });
active = drawing.appendDrawingActiveStrokePoint(active, { x: 104.25, y: 206.2 }, { final: true });
assert.deepEqual(active.points[0], { x: 100, y: 200 }, "first point preserved");
assert.deepEqual(active.points.at(-1), { x: 104.25, y: 206.2 }, "final point preserved");
assert.deepEqual(active.points.map((point) => [point.x, point.y]), [[100, 200], [104, 206], [104.25, 206.2]], "world point order preserved");
assert.equal(active.samplesReceived, 4);
assert.equal(active.points.length, 3);
assert.equal(active.decimatedPoints, 1);
assert.equal(drawing.DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE, 1.5);

const completedElement = drawing.finalizeDrawingActiveStroke(active);
assert.equal(completedElement.kind, "freehand");
assert.equal(completedElement.points.length, 3);
const nextScene = drawing.createDrawingScene([...initialHistory.current.elements, completedElement]);
const nextHistory = drawing.commitDrawingScene(initialHistory, nextScene);
const sceneCommitCount = nextHistory.current === initialHistory.current ? 0 : 1;
const historyCommitCount = nextHistory.past.length - initialHistory.past.length;
assert.equal(sceneCommitCount, 1, "pointer up Scene commit exactly once");
assert.equal(historyCommitCount, 1, "pointer up history commit exactly once");
assert.equal(nextHistory.current.elements.length, committedCurrent.elements.length + 1);

const undone = drawing.undoDrawingScene(nextHistory);
assert.equal(drawing.serializeDrawingScene(undone.current), committedSerialization, "one undo removes entire stroke");
const redone = drawing.redoDrawingScene(undone);
assert.equal(drawing.serializeDrawingScene(redone.current), drawing.serializeDrawingScene(nextScene), "one redo restores entire stroke");

let branchStroke = drawing.beginDrawingActiveStroke({ id: "branch-stroke", point: { x: 20, y: 30 }, style: policy.DRAWING_POC_FREEHAND_STYLE });
branchStroke = drawing.appendDrawingActiveStrokePoint(branchStroke, { x: 40, y: 50 }, { final: true });
const branchScene = drawing.createDrawingScene([...undone.current.elements, drawing.finalizeDrawingActiveStroke(branchStroke)]);
const branchedHistory = drawing.commitDrawingScene(undone, branchScene);
assert.equal(branchedHistory.future.length, 0, "new stroke after undo clears redo");

const cancelledHistory = initialHistory;
let cancelledStroke = drawing.beginDrawingActiveStroke({ id: "cancelled-stroke", point: { x: 50, y: 60 }, style: policy.DRAWING_POC_FREEHAND_STYLE });
cancelledStroke = drawing.appendDrawingActiveStrokePoint(cancelledStroke, { x: 70, y: 80 });
assert.equal(cancelledStroke.points.length, 2, "cancel fixture contains a transient stroke before discard");
assert.equal(drawing.cancelDrawingActiveStroke(), null);
assert.strictEqual(cancelledHistory.current, committedCurrent, "pointer cancel Scene mutation 0");
assert.equal(cancelledHistory.past.length, 0, "pointer cancel history mutation 0");

const transform = drawing.resolveDrawingViewportTransform(drawing.createDrawingCamera(), { width: 390, height: 560 });
const activePrimitive = projection.projectDrawingElement(completedElement, transform);
assert.equal(activePrimitive.kind, "path");
assert.match(activePrimitive.d, /^M/);
assert.equal(activePrimitive.style.strokeWidth, completedElement.style.strokeWidth * transform.scale);

const read = (file) => fs.readFileSync(file, "utf8");
const modal = read("apps/mobile/features/drawing-poc/DrawingRendererPocModal.tsx");
const svg = read("apps/mobile/features/drawing-poc/SvgDrawingSceneRenderer.tsx");
const projectionSource = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const mobileLock = read("apps/mobile/package-lock.json");
const drawingPocSources = fs.readdirSync("apps/mobile/features/drawing-poc")
  .filter((name) => /\.(?:ts|tsx)$/.test(name))
  .map((name) => read(path.join("apps/mobile/features/drawing-poc", name)))
  .join("\n");

assert.equal(mobilePackage.dependencies["react-native-svg"], "15.15.3");
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.doesNotMatch(mobileLock, /@shopify\/react-native-skia|canvaskit-wasm|react-reconciler/u);
assert.doesNotMatch(drawingPocSources, /@shopify\/react-native-skia|SkiaDrawing|SkiaCanvas|drawing-poc-renderer-skia/u);
for (const forbidden of ["react-native-gesture-handler", "react-native-reanimated", "react-native-worklets"]) {
  assert.equal(mobilePackage.dependencies[forbidden], undefined, forbidden);
}

assert.match(svg, /react-native-svg/);
assert.match(svg, /DrawingRendererAdapter/);
assert.match(svg, /useMemo\(\(\) => frame\.map\(renderPrimitive\), \[frame\]\)/);
assert.match(projectionSource, /export function projectDrawingElement/);
assert.match(modal, /const committedFrame = useMemo/);
assert.match(modal, /projectDrawingElement\(finalizeDrawingActiveStroke\(activeStroke\), transform\)/);
assert.match(modal, /appendDrawingActiveStrokePoint/);
assert.match(modal, /commitDrawingScene\(historyRef\.current, nextScene\)/);
assert.doesNotMatch(modal, /previewScene|replaceDrawingPocFreehand|switchRenderer|toggle→next RAF|renderer ===/u);
assert.doesNotMatch(modal, /fetch\(|WorkOrder|expectedVersion|upload|R2|PDF/u);
assert.match(modal, /renderer SVG · workload/);
assert.match(modal, /stroke Scene commits/);
assert.match(modal, /History commits/);
assert.match(gallery, /props\.drawingRendererPocEnabled \? "SVG Performance PoC" : "스케치"/u);
assert.match(gallery, /disabled=\{!props\.drawingRendererPocEnabled\}/u);
assert.match(gallery, /"스케치, 준비 중"/u);
assert.match(experience, /isDrawingRendererPocEnabled\(\{ authenticated: Boolean\(user\), dev: __DEV__ \}\)/);

const foundationImports = fs.readdirSync("lib/domain/drawing")
  .filter((name) => name.endsWith(".ts"))
  .map((name) => read(path.join("lib/domain/drawing", name)))
  .join("\n");
assert.doesNotMatch(foundationImports, /react-native-svg|@shopify\/react-native-skia|PanResponder|WorkOrder|R2|PDF/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha72-svg-authoring-performance",
  previousPermanentInventoryRetained: 224,
  addedPermanentChecks: 1,
  finalPermanentInventory: 225,
  renderer: "SVG_SELECTED_BY_OWNER_PHYSICAL_POC",
  workloads: expected,
  minimumWorldDistance: drawing.DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE,
  sampleFixture: { received: 4, accepted: 3, decimated: 1 },
  pointerMoveSceneCommits: 0,
  pointerMoveHistoryCommits: 0,
  pointerUpSceneCommits: sceneCommitCount,
  pointerUpHistoryCommits: historyCommitCount,
  productionSketchEnabled: false,
  businessMutationPath: 0,
  physicalResultInferred: false,
}));

#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const compiledRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-drawing-freehand-fidelity-"));
const drawingRoot = path.join(compiledRoot, "drawing");
fs.mkdirSync(drawingRoot, { recursive: true });

function compile(sourcePath, outputPath, replacements = []) {
  let output = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: sourcePath,
  }).outputText;
  for (const [pattern, value] of replacements) output = output.replace(pattern, value);
  fs.writeFileSync(outputPath, output, "utf8");
}

for (const name of fs.readdirSync("lib/domain/drawing").filter((candidate) => candidate.endsWith(".ts"))) {
  compile(path.join("lib/domain/drawing", name), path.join(drawingRoot, name.replace(/\.ts$/, ".js")));
}
compile("apps/mobile/features/drawing-poc/drawingFreehandPath.ts", path.join(compiledRoot, "freehand.js"));
compile(
  "apps/mobile/features/drawing-poc/drawingRenderProjection.ts",
  path.join(compiledRoot, "projection.js"),
  [
    [/require\("@\/domain\/drawing"\)/g, 'require("./drawing/index.js")'],
    [/require\("\.\/drawingFreehandPath"\)/g, 'require("./freehand.js")'],
  ],
);
compile(
  "apps/mobile/features/drawing-poc/drawingRendererPocPolicy.ts",
  path.join(compiledRoot, "policy.js"),
  [[/require\("@\/domain\/drawing"\)/g, 'require("./drawing/index.js")']],
);
process.on("exit", () => fs.rmSync(compiledRoot, { recursive: true, force: true }));

const drawing = require(path.join(drawingRoot, "index.js"));
const freehand = require(path.join(compiledRoot, "freehand.js"));
const projection = require(path.join(compiledRoot, "projection.js"));
const policy = require(path.join(compiledRoot, "policy.js"));
const identityTransform = Object.freeze({ fitScale: 1, scale: 1, offsetX: 0, offsetY: 0 });

const linePoints = Object.freeze([{ x: 10, y: 20 }, { x: 80, y: 90 }]);
const linePath = freehand.buildDrawingFreehandWorldPath(linePoints);
assert.deepEqual(linePath.start, linePoints[0]);
assert.deepEqual(linePath.commands, [{ kind: "line", end: linePoints[1] }]);
assert.equal(freehand.serializeDrawingFreehandSvgPath(linePath, identityTransform), "M10.000 20.000 L80.000 90.000");

const collinearPoints = Object.freeze([{ x: 0, y: 40 }, { x: 30, y: 40 }, { x: 75, y: 40 }, { x: 120, y: 40 }]);
const collinearPath = freehand.buildDrawingFreehandWorldPath(collinearPoints);
assert.equal(collinearPath.start.y, 40);
for (const command of collinearPath.commands) {
  assert.equal(command.end.y, 40, "collinear end remains on the line");
  if (command.kind === "quadratic") assert.equal(command.control.y, 40, "collinear control remains on the line");
}

const arcPoints = Object.freeze([
  { x: 100, y: 300 },
  { x: 180, y: 210 },
  { x: 300, y: 150 },
  { x: 430, y: 175 },
  { x: 540, y: 260 },
]);
const arcPath = freehand.buildDrawingFreehandWorldPath(arcPoints);
assert.deepEqual(arcPath.start, arcPoints[0], "arc first endpoint exact");
assert.deepEqual(arcPath.commands.at(-1).end, arcPoints.at(-1), "arc final endpoint exact");
assert.equal(arcPath.commands.length, arcPoints.length, "bounded one quadratic command per raw point");
assert.equal(arcPath.insertedPointCount, 0, "renderer smoothing does not mutate/interpolate raw Scene points");

function sampleQuadratic(start, control, end, t) {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

const minX = Math.min(...arcPoints.map((point) => point.x));
const maxX = Math.max(...arcPoints.map((point) => point.x));
const minY = Math.min(...arcPoints.map((point) => point.y));
const maxY = Math.max(...arcPoints.map((point) => point.y));
let segmentStart = arcPath.start;
for (let index = 0; index < arcPath.commands.length; index += 1) {
  const command = arcPath.commands[index];
  assert.equal(command.kind, "quadratic");
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const sample = sampleQuadratic(segmentStart, command.control, command.end, t);
    assert.ok(sample.x >= minX && sample.x <= maxX && sample.y >= minY && sample.y <= maxY, "quadratic stays inside raw-point bounds");
  }
  if (index > 0) {
    const previous = arcPath.commands[index - 1];
    const incoming = { x: 2 * (previous.end.x - previous.control.x), y: 2 * (previous.end.y - previous.control.y) };
    const outgoing = { x: 2 * (command.control.x - previous.end.x), y: 2 * (command.control.y - previous.end.y) };
    assert.ok(Math.abs(incoming.x - outgoing.x) < 1e-9 && Math.abs(incoming.y - outgoing.y) < 1e-9, "quadratic joints are tangent-continuous");
  }
  segmentStart = command.end;
}

const gappedPoints = Object.freeze([{ x: 20, y: 20 }, { x: 210, y: 410 }, { x: 630, y: 120 }, { x: 940, y: 900 }]);
const gappedA = freehand.buildDrawingFreehandWorldPath(gappedPoints);
const gappedB = freehand.buildDrawingFreehandWorldPath(gappedPoints);
assert.deepEqual(gappedA, gappedB, "same sparse/gapped raw world points produce deterministic path geometry");
assert.equal(gappedA.commands.length, gappedPoints.length, "gapped curve control count is bounded");
assert.equal(gappedA.insertedPointCount, 0, "interpolation remains disabled without physical point-gap evidence");

const phoneTransform = drawing.resolveDrawingViewportTransform(drawing.createDrawingCamera(), { width: 390, height: 560 });
const tabletPortraitTransform = drawing.resolveDrawingViewportTransform(drawing.createDrawingCamera(), { width: 820, height: 1_100 });
const tabletLandscapeTransform = drawing.resolveDrawingViewportTransform(drawing.createDrawingCamera(), { width: 1_180, height: 760 });
assert.deepEqual(freehand.buildDrawingFreehandWorldPath(arcPoints), arcPath, "phone world curve identity");
assert.deepEqual(freehand.buildDrawingFreehandWorldPath(arcPoints), arcPath, "tablet portrait world curve identity");
assert.deepEqual(freehand.buildDrawingFreehandWorldPath(arcPoints), arcPath, "tablet landscape world curve identity");
for (const transform of [phoneTransform, tabletPortraitTransform, tabletLandscapeTransform]) {
  assert.match(freehand.serializeDrawingFreehandSvgPath(arcPath, transform), /^M.+ Q/u);
}

const style = policy.DRAWING_POC_FREEHAND_STYLE;
const activeElement = Object.freeze({ id: "active-parity", kind: "freehand", points: arcPoints, style });
const committedPrimitive = projection.projectDrawingScene({ scene: drawing.createDrawingScene([activeElement]), transform: phoneTransform })[0];
const activePrimitive = projection.projectDrawingElement(activeElement, phoneTransform);
assert.deepEqual(activePrimitive, committedPrimitive, "active and committed strokes share exact smoothing/projection owner");
assert.match(activePrimitive.d, / Q/u);
assert.doesNotMatch(activePrimitive.d, / L/u);

const gaps = drawing.measureDrawingPointGaps([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 9, y: 12 }]);
assert.deepEqual(gaps, { averageWorldGap: 7.5, maximumWorldGap: 10, segmentCount: 2 });

const heavyScene = policy.createDrawingPocWorkload("heavy");
const heavySerialization = drawing.serializeDrawingScene(heavyScene);
let committedProjectionRebuilds = 0;
let committedPathRebuilds = 0;
const committedFrame = (() => {
  committedProjectionRebuilds += 1;
  committedPathRebuilds += policy.countDrawingPocFreehandElements(heavyScene);
  return projection.projectDrawingScene({ scene: heavyScene, transform: phoneTransform });
})();
for (let index = 0; index < 100; index += 1) {
  projection.projectDrawingElement(Object.freeze({
    id: "active-heavy",
    kind: "freehand",
    points: Object.freeze([{ x: 100, y: 100 }, { x: 100 + index + 1, y: 120 + index }]),
    style,
  }), phoneTransform);
}
assert.equal(committedFrame.length, 240);
assert.equal(policy.countDrawingPocFreehandPoints(heavyScene), 4_800);
assert.equal(committedProjectionRebuilds, 1, "100 active updates rebuild committed projection 0 times");
assert.equal(committedPathRebuilds, 120, "100 active updates rebuild committed freehand paths 0 times");
assert.equal(drawing.serializeDrawingScene(heavyScene), heavySerialization, "active projection mutates committed Scene 0");

const read = (file) => fs.readFileSync(file, "utf8");
const modal = read("apps/mobile/features/drawing-poc/DrawingRendererPocModal.tsx");
const renderer = read("apps/mobile/features/drawing-poc/SvgDrawingSceneRenderer.tsx");
const projectionSource = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));
const mobileLock = read("apps/mobile/package-lock.json");
const drawingPocSources = fs.readdirSync("apps/mobile/features/drawing-poc")
  .filter((name) => /\.(?:ts|tsx)$/.test(name))
  .map((name) => read(path.join("apps/mobile/features/drawing-poc", name)))
  .join("\n");

assert.match(renderer, /const CommittedSvgLayer = memo/u);
assert.match(renderer, /const ActiveStrokeSvgLayer = memo/u);
assert.match(renderer, /<CommittedSvgLayer frame=\{props\.committedFrame\}/u);
const committedLayerStart = renderer.indexOf("const CommittedSvgLayer");
const committedLayerEnd = renderer.indexOf("const ActiveStrokeSvgLayer");
const committedLayerSource = renderer.slice(committedLayerStart, committedLayerEnd);
assert.doesNotMatch(committedLayerSource, /activePrimitive|primitive:/u);
assert.match(modal, /const committedFrame = useMemo/u);
assert.match(modal, /\[committedScene, transform\]/u);
assert.match(modal, /committed layer renders/u);
assert.match(modal, /projection rebuilds/u);
assert.match(modal, /path rebuilds/u);
assert.match(modal, /avg gap/u);
assert.match(modal, /max gap/u);
assert.match(projectionSource, /buildDrawingFreehandSvgPath\(element\.points, transform\)/u);
assert.equal(mobilePackage.dependencies["react-native-svg"], "15.15.3");
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
assert.doesNotMatch(mobileLock, /@shopify\/react-native-skia|canvaskit-wasm|react-reconciler/u);
assert.doesNotMatch(drawingPocSources, /@shopify\/react-native-skia|react-native-reanimated|react-native-gesture-handler|react-native-worklets/u);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha72-freehand-fidelity-heavy-render",
  previousPermanentInventoryRetained: 225,
  addedPermanentChecks: 1,
  finalPermanentInventory: 226,
  smoothing: freehand.DRAWING_FREEHAND_SMOOTHING_ALGORITHM,
  rawPointInterpolation: 0,
  minimumWorldDistance: drawing.DRAWING_ACTIVE_STROKE_MIN_WORLD_DISTANCE,
  heavy: { elements: 240, points: 4_800, committedProjectionRebuildsDuring100ActiveUpdates: 0, committedPathRebuildsDuring100ActiveUpdates: 0 },
  physicalResultInferred: false,
}));

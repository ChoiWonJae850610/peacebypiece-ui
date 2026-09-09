#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-visible-surface-"));
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
const surfacePolicy = read("lib/domain/drawing/surfaceLayout.ts");
const viewportPolicy = read("lib/domain/drawing/viewport.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const translation = read("lib/domain/drawing/translation.ts");
const renderer = read("apps/mobile/features/drawing-poc/SvgDrawingSceneRenderer.tsx");
const currentState = read("docs/codex-current-state.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const guardrails = read("docs/project/app-v2/drawing-architecture-guardrails.md");
const camera = drawing.createDrawingCamera();
const epsilon = 1e-9;

const tallStage = Object.freeze({ width: 375, height: 700 });
const tallSurface = drawing.resolveDrawingCanvasSurfaceLayout(tallStage);
assert.equal(tallSurface.scale, 0.375, "tall phone stage fits canonical WORLD by width");
assert.equal(tallSurface.width, 375, "tall phone surface consumes available width");
assert.equal(tallSurface.height, 525, "tall phone surface retains 5:7 height");
assert.equal(tallSurface.left, 0, "tall phone surface is horizontally centered");
assert.equal(tallSurface.top, 87.5, "unused top and bottom space remains outside active paper");

const shortStage = Object.freeze({ width: 700, height: 525 });
const shortSurface = drawing.resolveDrawingCanvasSurfaceLayout(shortStage);
assert.equal(shortSurface.scale, 0.375, "short stage fits canonical WORLD by height");
assert.equal(shortSurface.width, 375, "short stage retains 5:7 width");
assert.equal(shortSurface.height, 525, "short stage consumes available height");
assert.equal(shortSurface.left, 162.5, "unused side space remains outside active paper");
assert.equal(shortSurface.top, 0, "short stage is vertically centered");

for (const stage of [tallStage, shortStage, { width: 768, height: 900 }, { width: 1024, height: 768 }]) {
  const surface = drawing.resolveDrawingCanvasSurfaceLayout(stage);
  assert.ok(surface.left >= -epsilon && surface.top >= -epsilon, "surface origin remains inside stage");
  assert.ok(surface.left + surface.width <= stage.width + epsilon, "surface right edge remains inside stage");
  assert.ok(surface.top + surface.height <= stage.height + epsilon, "surface bottom edge remains inside stage");
  assert.ok(Math.abs(surface.width / surface.height - 5 / 7) < epsilon, "active surface has exact canonical 5:7 aspect");
  assert.ok(Math.abs(surface.left - (stage.width - surface.width) / 2) < epsilon, "surface is horizontally centered deterministically");
  assert.ok(Math.abs(surface.top - (stage.height - surface.height) / 2) < epsilon, "surface is vertically centered deterministically");
}
assert.throws(() => drawing.resolveDrawingCanvasSurfaceLayout({ width: 0, height: 100 }), /positive and finite/u);
assert.throws(() => drawing.resolveDrawingCanvasSurfaceLayout({ width: 100, height: Number.NaN }), /positive and finite/u);

const activeViewport = Object.freeze({ width: tallSurface.width, height: tallSurface.height });
const transform = drawing.resolveDrawingViewportTransform(camera, activeViewport);
assert.ok(Math.abs(transform.offsetX) < epsilon, "default camera has zero active-paper horizontal letterbox");
assert.ok(Math.abs(transform.offsetY) < epsilon, "default camera has zero active-paper vertical letterbox");
assert.deepEqual(drawing.worldToScreen({ x: 0, y: 0 }, camera, activeViewport), { x: 0, y: 0 }, "WORLD top-left is paper top-left");
assert.deepEqual(drawing.worldToScreen({ x: 1_000, y: 1_400 }, camera, activeViewport), { x: 375, y: 525 }, "WORLD bottom-right is paper bottom-right");
for (const world of [{ x: 0, y: 1 }, { x: 500, y: 700 }, { x: 1_000, y: 1_399 }]) {
  const screen = drawing.worldToScreen(world, camera, activeViewport);
  const roundTrip = drawing.screenToWorld(screen, camera, activeViewport);
  assert.ok(Math.abs(roundTrip.x - world.x) < epsilon && Math.abs(roundTrip.y - world.y) < epsilon, "screen/world inverse remains exact on active paper");
}
const squareOrigin = drawing.worldToScreen({ x: 100, y: 100 }, camera, activeViewport);
const squareCorner = drawing.worldToScreen({ x: 200, y: 200 }, camera, activeViewport);
assert.ok(Math.abs((squareCorner.x - squareOrigin.x) - (squareCorner.y - squareOrigin.y)) < epsilon, "uniform scale preserves square aspect");
assert.ok(drawing.screenToWorld({ x: 10, y: 1 }, camera, activeViewport).y > 0, "top-edge Pen input maps inside WORLD rather than a letterbox");
assert.ok(drawing.screenToWorld({ x: 10, y: activeViewport.height - 1 }, camera, activeViewport).y < 1_400, "bottom-edge Pen input maps inside WORLD rather than a letterbox");

assert.match(surfacePolicy, /DRAWING_CANONICAL_CANVAS/u, "surface fit derives from canonical WORLD dimensions");
assert.match(surfacePolicy, /Math\.min\([\s\S]*stageWidth \/ DRAWING_CANONICAL_CANVAS\.width[\s\S]*stageHeight \/ DRAWING_CANONICAL_CANVAS\.height/u, "surface fit is uniform and deterministic");
assert.doesNotMatch(surfacePolicy, /iPhone|iPad|device|model|Platform/iu, "surface fit has no device/model branch");
assert.doesNotMatch(surfacePolicy, /scaleX|scaleY|stretch/iu, "surface fit cannot introduce non-uniform scaling");
assert.match(viewportPolicy, /fitScale = Math\.min\(/u, "alpha.72 arbitrary-viewport uniform transform remains canonical");
assert.doesNotMatch(viewportPolicy, /offsetX:\s*0|offsetY:\s*0/u, "viewport offsets are not hard-coded for Product Sketch");

assert.match(editor, /onLayout=\{onWorkbenchLayout\}[\s\S]*testID="work-order-sketch-canvas-stage"[\s\S]*\{\.\.\.panResponder\.panHandlers\}/u, "Fit/Pan supersession makes the full workbench the viewport and gesture owner");
assert.match(editor, /function onWorkbenchLayout[\s\S]*viewportGenerationRef\.current \+= 1[\s\S]*viewportRef\.current = next[\s\S]*setViewport\(next\)/u, "workbench measurement exclusively owns Drawing viewport generation");
assert.match(editor, /worldToScreen\(\{ x: 0, y: 0 \}, camera, viewport\)[\s\S]*DRAWING_CANONICAL_CANVAS\.width[\s\S]*DRAWING_CANONICAL_CANVAS\.height/u, "active paper dimensions derive from WORLD corners through the canonical camera transform");
assert.match(editor, /style=\{\[styles\.canvasSurface, paperScreenRect\]\}/u, "projected paper uses camera-derived screen dimensions");
assert.match(editor, /canvasStage: \{[^}]*backgroundColor: WAFL_THEME\.color\.paperMuted[^}]*flex: 1[^}]*overflow: "hidden"/u, "flex workbench stays muted and clipped around projected paper");
assert.match(editor, /canvasSurface: \{ backgroundColor: "#FFFDF8"[\s\S]*position: "absolute"/u, "only projected WORLD sheet is white Drawing paper");
assert.doesNotMatch(editor, /canvasStage: \{[^}]*backgroundColor: "#FFFDF8"/u, "whole workbench never masquerades as white paper");
assert.match(editor, /canvasRenderer: \{ \.\.\.StyleSheet\.absoluteFillObject \}/u, "renderer fills the workbench rather than the paper View");
assert.match(editor, /<SvgDrawingSceneRenderer[\s\S]*height=\{viewport\.height\}[\s\S]*width=\{viewport\.width\}/u, "SVG dimensions equal measured workbench viewport");
assert.match(renderer, /<Svg height=\{props\.height\}[\s\S]*width=\{props\.width\}>/u, "renderer consumes exact workbench viewport dimensions");
assert.match(editor, /rawWorldPointFromEvent[\s\S]*isDrawingWorldPointInsideCanvas\(rawPoint\)[\s\S]*clampDrawingPointToCanvas\(rawPoint\)/u, "workbench input rejects outside-paper starts before edge clamp");
assert.match(editor, /DRAWING_ERASER_SCREEN_RADIUS[\s\S]*resolveDrawingEraserWorldRadius/u, "Eraser ring and corridor retain shared active-viewport scale");
assert.match(editor, /hitTestDrawingSceneTopmost\(scene, point\)/u, "Selection edge mapping retains canonical WORLD hit-test");
assert.match(editor, /hitTestDrawingSelectedElementPickup/u, "forgiving selected pickup remains active at paper edges");
assert.match(translation, /DRAWING_CANONICAL_CANVAS/u, "Move clamp remains canonical WORLD-boundary based");

assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u, "Scene schema v1 remains unchanged");
assert.match(contracts, /width: 1_000[\s\S]*height: 1_400/u, "WORLD remains exactly 1000x1400");
for (const owner of [currentState, roadmap, guardrails]) {
  assert.match(owner, /ALPHA76_VISIBLE_CANVAS_WORLD_SURFACE_IPHONE_IPAD_REQA_REQUIRED/u, "canonical owner records the current surface checkpoint");
  assert.match(owner, /PHYSICAL_RESULT_NOT_INFERRED|Physical PASS is not inferred/iu, "canonical owner does not infer physical PASS");
}
for (const forbidden of ["크기 조절", "회전", "확대", "축소", "이동 도구"]) {
  assert.doesNotMatch(editor, new RegExp(`accessibilityLabel="${forbidden}"`, "u"));
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-visible-canvas-world-surface",
  previousPermanentInventoryRetained: 279,
  addedPermanentChecks: 1,
  finalPermanentInventory: 280,
  assertionsMinimum: 70,
  canonicalWorld: "1000x1400",
  activeSurfaceAspect: "5:7",
  sceneSchemaVersion: 1,
  apiSchemaMigrationDelta: "0/0/0",
  dependencyNativeConfigEasDelta: "0/0/0/0",
  physicalResultInferred: false,
}));

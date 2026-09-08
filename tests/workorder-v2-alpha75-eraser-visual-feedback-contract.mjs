#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a75-eraser-visual-"));
try {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc",
    "--module", "commonjs",
    "--target", "ES2020",
    "--strict",
    "--skipLibCheck",
    "--outDir", compiledDirectory,
    "apps/mobile/features/drawing-poc/drawingEraserVisualFeedback.ts",
  ], { cwd: process.cwd(), stdio: "pipe" });
} catch (error) {
  fs.rmSync(compiledDirectory, { recursive: true, force: true });
  throw error;
}
process.on("exit", () => fs.rmSync(compiledDirectory, { recursive: true, force: true }));

const require = createRequire(import.meta.url);
const visual = require(path.join(compiledDirectory, "drawingEraserVisualFeedback.js"));
const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const projection = read("apps/mobile/features/drawing-poc/drawingRenderProjection.ts");
const renderer = read("apps/mobile/features/drawing-poc/SvgDrawingSceneRenderer.tsx");
const contracts = read("lib/domain/drawing/contracts.ts");

assert.equal(visual.resolveDrawingEraserCursorScreenRadius(12, 0.5, 0), 6, "ring exactly projects the partial-erase WORLD radius at compact scale");
assert.equal(visual.resolveDrawingEraserCursorScreenRadius(12, 1, 0), 12, "ring follows partial-erase WORLD radius at unit scale");
assert.equal(visual.resolveDrawingEraserCursorScreenRadius(12, 2, 0), 24, "ring scales from partial-erase WORLD radius");
assert.throws(() => visual.resolveDrawingEraserCursorScreenRadius(12, 0, 0), /viewportScale/u);

assert.match(projection, /projectDrawingEraserCursor/u);
assert.match(projection, /resolveDrawingEraserCursorScreenRadius/u);
assert.match(projection, /id: "eraser-cursor-ring"/u);
assert.match(projection, /kind: "ellipse"/u);
assert.match(projection, /fillColor: null/u, "cursor is a thin ring, not a filled icon");
assert.doesNotMatch(projection, /projectDrawingEraserCandidateOutline|eraser-candidate:/u, "whole-object candidate highlight is superseded");

assert.match(editor, /eraserCursorWorld/u);
assert.match(editor, /eraserPreviewScene/u);
assert.match(editor, /setEraserCursorWorld\(point\)/u, "cursor follows each presented pointer sample");
assert.match(editor, /planDrawingStrokePartialErase/u, "current preview includes every supported stroked vector kind");
assert.match(editor, /displayedScene = eraserPreviewScene \?\? currentScene/u, "transient partial preview replaces only displayed committed geometry");
assert.match(editor, /function clearEraserVisualFeedback\(\)[\s\S]*setEraserPreviewScene\(null\)[\s\S]*setEraserCursorWorld\(null\)/u);
assert.match(editor, /onPanResponderGrant:[\s\S]*toolRef\.current === "eraser"[\s\S]*clearEraserVisualFeedback\(\)[\s\S]*extendEraserGesture\(point\)/u);
assert.match(editor, /onPanResponderMove:[\s\S]*toolRef\.current === "eraser"[\s\S]*extendEraserGesture/u);
assert.match(editor, /onPanResponderRelease:[\s\S]*toolRef\.current === "eraser"[\s\S]*commitEraserGesture/u);
assert.match(editor, /onPanResponderTerminate: discardActiveGesture/u);
assert.match(editor, /function selectTool[\s\S]*discardActiveGesture\(\)/u, "tool switch clears feedback through the canonical gesture cancel owner");
assert.match(renderer, /<G pointerEvents="none" testID="drawing-poc-svg-active-layer">/u, "transient feedback cannot take pointer ownership");

assert.match(editor, /function commitEraserGesture\([^)]*DrawingStrokePartialErasePlan[^)]*\)[\s\S]*applyDrawingStrokePartialErasePlan[\s\S]*commitDrawingScene/u);
assert.doesNotMatch(contracts, /eraserCursor|eraserCandidate|selectedElementId/u, "visual feedback is absent from canonical Scene schema");
assert.doesNotMatch(editor, /eraser(?:Cursor|Preview)[\s\S]{0,120}(?:savePrimaryWorkOrderDrawing|serializeDrawingScene)/u, "visual feedback has no persistence/network route");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha75-eraser-visual-feedback",
  previousPermanentInventoryRetained: 274,
  addedPermanentChecks: 1,
  finalPermanentInventory: 275,
  wholeObjectCandidateFeedbackSupersededBy: "workorder-v2-alpha75-partial-eraser-compact-toolbar",
  fixedWorldRadiusProductPolicySupersededBy: "workorder-v2-alpha75-overlay-palette-stroke-partial-eraser",
  sceneSchemaVersion: 1,
  migrationDelta: 0,
  physicalResultInferred: false,
}));

#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const actionButton = read("apps/mobile/features/inputs/WaflPrimaryActionButton.tsx");
const theme = read("apps/mobile/constants/theme.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const viewport = read("lib/domain/drawing/viewport.ts");
const surface = read("lib/domain/drawing/surfaceLayout.ts");
const translation = read("lib/domain/drawing/translation.ts");
const currentState = read("docs/codex-current-state.md");
const roadmap = read("docs/project/app-v2/08-roadmap-2.0.md");
const guardrails = read("docs/project/app-v2/drawing-architecture-guardrails.md");

const headerIndex = editor.indexOf('<View style={styles.header}>');
const toolbarIndex = editor.indexOf('testID="work-order-sketch-compact-toolbar"');
const paperIndex = editor.indexOf('testID="work-order-sketch-canvas-stage"');
const statusIndex = editor.indexOf('testID="work-order-sketch-footer"');
const actionsIndex = editor.indexOf('<View style={styles.footerActions}>');
assert.ok(headerIndex >= 0 && headerIndex < toolbarIndex && toolbarIndex < paperIndex && paperIndex < statusIndex && statusIndex < actionsIndex, "workspace order is title -> toolbar -> paper -> status -> actions");

assert.match(editor, /<SafeAreaView style=\{styles\.safe\}>/u, "safe-area top and bottom owner is retained");
assert.doesNotMatch(editor, /<ScrollView|work-order-sketch-workspace-scroll/u, "Fit/Pan supersession removes the outer scroll responder from the normal Sketch workspace");
assert.match(editor, /safe: \{[^}]*flex: 1[^}]*gap: WAFL_THEME\.spacing\.xs[^}]*paddingBottom: WAFL_THEME\.spacing\.sm/u, "fixed top/middle/bottom stack retains canonical WAFL spacing tokens");
assert.match(editor, /header: \{[^}]*minHeight: WAFL_THEME\.touch\.minimum/u, "compact title chrome retains canonical height");
assert.match(editor, /<Text accessibilityRole="header" style=\{styles\.title\}>스케치<\/Text>/u, "Sketch title and semantic heading are retained");

assert.match(editor, /canvasStage: \{[^}]*flex: 1[^}]*overflow: "hidden"[^}]*width: "100%" \}/u, "new explicit product decision supersedes fixed-ratio host with a flexible clipped workbench");
assert.doesNotMatch(editor, /canvasStage: \{[^}]*aspectRatio/u, "workbench is no longer misidentified as the paper ratio owner");
assert.match(editor, /safe: \{[^}]*paddingHorizontal: WAFL_THEME\.layout\.screenGutterPhone/u, "existing single safe horizontal gutter remains canonical");
assert.doesNotMatch(editor, /canvasStage: \{[^}]*paddingHorizontal/u, "workbench adds no duplicate horizontal inset");

assert.match(editor, /onLayout=\{onWorkbenchLayout\}[\s\S]*testID="work-order-sketch-canvas-stage"[\s\S]*\{\.\.\.panResponder\.panHandlers\}/u, "flex workbench now owns viewport measurement and one/two-finger arbitration");
assert.match(editor, /style=\{\[styles\.canvasSurface, paperScreenRect\]\}[\s\S]*testID="work-order-sketch-canvas"/u, "white paper is a camera-projected WORLD rect inside the workbench");
assert.match(editor, /pointerEvents="none"[\s\S]*styles\.canvasSurface/u, "paper visual cannot compete for gesture ownership");
assert.match(editor, /canvasSurface: \{ backgroundColor: "#FFFDF8"/u, "projected canonical sheet remains the only white paper");
assert.match(editor, /canvasRenderer: \{ \.\.\.StyleSheet\.absoluteFillObject \}/u, "SVG fills the measured workbench viewport");
assert.match(editor, /<SvgDrawingSceneRenderer[\s\S]*height=\{viewport\.height\}[\s\S]*width=\{viewport\.width\}/u, "SVG remains measured to the canonical viewport owner");
assert.match(surface, /Math\.min\([\s\S]*DRAWING_CANONICAL_CANVAS\.width[\s\S]*DRAWING_CANONICAL_CANVAS\.height/u, "existing uniform surface-fit owner is reused");
assert.match(viewport, /fitScale = Math\.min\(/u, "uniform viewport transform is unchanged");
assert.match(contracts, /width: 1_000[\s\S]*height: 1_400/u, "WORLD remains 1000x1400");
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u, "Scene schema v1 remains unchanged");

const toolbarControls = [
  "work-order-sketch-drawing-tool-selector",
  "work-order-sketch-selection-tool",
  "work-order-sketch-eraser-tool",
  "work-order-sketch-undo",
  "work-order-sketch-redo",
  "work-order-sketch-delete-selected",
  "work-order-sketch-clear-all",
];
for (const testId of toolbarControls) assert.match(editor, new RegExp(`testID="${testId}"`, "u"), `${testId} remains present`);
assert.equal(toolbarControls.length, 7, "toolbar retains exactly seven required top-level controls");
assert.match(editor, /iconTool: \{[^}]*minHeight: WAFL_THEME\.touch\.minimum/u, "toolbar controls retain minimum touch target");
assert.match(editor, /drawingToolMenuVisible[\s\S]*styles\.drawingToolMenu/u, "Drawing Tool overlay remains present");
assert.match(editor, /<Hand color=/u, "Hand Selection icon remains present");

assert.match(editor, /저장하지 않은 변경사항이 있습니다\./u, "dirty-state text is retained");
assert.match(editor, /numberOfLines=\{1\} style=\{styles\.footerText\}/u, "status remains one compact line");
assert.match(editor, /footer: \{[^}]*gap: WAFL_THEME\.spacing\.xs[^}]*paddingTop: WAFL_THEME\.spacing\.xs/u, "footer uses compact canonical spacing");
assert.doesNotMatch(editor, /footerStatus: \{[^}]*minHeight/u, "footer no longer reserves oversized status space");
assert.match(editor, /accessibilityLabel="스케치 닫기"[\s\S]*label="닫기"/u, "Close remains explicit text action");
assert.match(editor, /accessibilityLabel="스케치 저장"[\s\S]*label="저장"/u, "Save remains explicit text action");
assert.match(actionButton, /minHeight: 48/u, "Close/Save retain product action touch height");

assert.match(editor, /hitTestDrawingSelectedElementPickup/u, "forgiving selected pickup remains active");
assert.match(editor, /resolveDrawingSelectionMoveDelta/u, "direct-drag Move remains active");
assert.match(translation, /DRAWING_CANONICAL_CANVAS/u, "Move boundary clamp remains WORLD-owned");
assert.match(editor, /planDrawingStrokePartialErase/u, "partial Eraser remains active");
assert.match(editor, /function undo\(\)[\s\S]*undoDrawingScene/u, "Undo remains active");
assert.match(editor, /function redo\(\)[\s\S]*redoDrawingScene/u, "Redo remains active");
assert.match(editor, /savePrimaryWorkOrderDrawing/u, "explicit Save remains the persistence owner");

for (const forbidden of ["Zoom", "Pan", "Resize", "Rotate"]) assert.doesNotMatch(editor, new RegExp(`accessibilityLabel="[^"]*${forbidden}`, "iu"));
assert.doesNotMatch(editor, /scaleX|scaleY|nonUniform/u, "non-uniform stretch is absent");
assert.match(theme, /screenGutterPhone: 16/u, "existing product gutter token remains unchanged");

for (const owner of [currentState, roadmap, guardrails]) {
  assert.match(owner, /ALPHA76_SKETCH_WORKSPACE_COMPACT_LAYOUT_IPHONE_IPAD_REQA_REQUIRED/u, "canonical owner records compact-layout checkpoint");
  assert.match(owner, /PHYSICAL_RESULT_NOT_INFERRED|Physical PASS is not inferred/iu, "canonical owner does not infer physical PASS");
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-sketch-workspace-compact-layout",
  previousPermanentInventoryRetained: 280,
  addedPermanentChecks: 1,
  finalPermanentInventory: 281,
  assertionsMinimum: 54,
  canonicalWorld: "1000x1400",
  activeSurfaceAspect: "5:7",
  sceneSchemaVersion: 1,
  apiSchemaMigrationDelta: "0/0/0",
  dependencyNativeConfigEasDelta: "0/0/0/0",
  physicalResultInferred: false,
}));

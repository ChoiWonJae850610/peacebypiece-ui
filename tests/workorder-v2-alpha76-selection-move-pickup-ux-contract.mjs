#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-selection-pickup-"));
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
const packageJson = JSON.parse(read("apps/mobile/package.json"));
const contracts = read("lib/domain/drawing/contracts.ts");
const style = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 4 });
const screenPadding = 8;
const viewportScale = 0.5;

const elements = Object.freeze({
  arrow: Object.freeze({ id: "arrow:one", kind: "arrow", start: { x: 100, y: 100 }, end: { x: 300, y: 100 }, style }),
  ellipse: Object.freeze({ id: "ellipse:one", kind: "ellipse", bounds: { x: 100, y: 400, width: 200, height: 100 }, style }),
  fragment: Object.freeze({ id: "stroke:fragment", kind: "freehand", points: Object.freeze([{ x: 100, y: 800 }, { x: 300, y: 800 }]), style }),
  freehand: Object.freeze({ id: "stroke:one", kind: "freehand", points: Object.freeze([{ x: 100, y: 50 }, { x: 300, y: 50 }]), style }),
  line: Object.freeze({ id: "line:one", kind: "line", start: { x: 100, y: 150 }, end: { x: 300, y: 150 }, style }),
  rectangle: Object.freeze({ id: "rectangle:one", kind: "rectangle", bounds: { x: 100, y: 200, width: 200, height: 100 }, style }),
  text: Object.freeze({ id: "text:one", kind: "text", anchor: { x: 100, y: 600 }, content: "포켓 2cm 위", fontSize: 34, style }),
});

const canonicalLineBounds = drawing.resolveDrawingElementWorldBounds(elements.line, 0);
const pickupLineBounds = drawing.resolveDrawingSelectedElementPickupBounds(elements.line, screenPadding, viewportScale);
assert.equal(
  pickupLineBounds.x,
  canonicalLineBounds.x - drawing.DRAWING_SELECTION_OUTLINE_PADDING_WORLD - screenPadding / viewportScale,
  "pickup reuses canonical bounds plus outline and inverse-projected screen padding",
);
assert.equal(
  pickupLineBounds.width,
  canonicalLineBounds.width + 2 * (drawing.DRAWING_SELECTION_OUTLINE_PADDING_WORLD + screenPadding / viewportScale),
  "pickup bounds include the visible outline interior and token padding",
);
assert.throws(
  () => drawing.resolveDrawingSelectedElementPickupBounds(elements.line, screenPadding, 0),
  /positive/u,
  "invalid viewport scale cannot create a device-specific pickup region",
);

const forgivingPoints = Object.freeze({
  arrow: { x: 180, y: 125 },
  ellipse: { x: 200, y: 450 },
  fragment: { x: 180, y: 820 },
  freehand: { x: 180, y: 70 },
  line: { x: 180, y: 170 },
  rectangle: { x: 200, y: 250 },
  text: { x: 120, y: 590 },
});
for (const kind of Object.keys(elements)) {
  assert.equal(
    drawing.hitTestDrawingSelectedElementPickup(elements[kind], forgivingPoints[kind], screenPadding, viewportScale),
    true,
    `${kind} supports forgiving selected-object pickup`,
  );
}
for (const kind of ["arrow", "ellipse", "fragment", "freehand", "line", "rectangle"]) {
  assert.equal(
    drawing.hitTestDrawingElement(elements[kind], forgivingPoints[kind]),
    false,
    `${kind} fixture proves fallback beyond precise visible geometry`,
  );
}
assert.equal(drawing.hitTestDrawingElement(elements.line, { x: 180, y: 150 }), true, "same selected precise geometry remains an actual hit");
assert.equal(
  drawing.hitTestDrawingSelectedElementPickup(elements.rectangle, { x: 900, y: 900 }, screenPadding, viewportScale),
  false,
  "true empty outside selected pickup remains empty",
);

const selectedLarge = Object.freeze({
  id: "rectangle:selected",
  kind: "rectangle",
  bounds: { x: 100, y: 100, width: 400, height: 300 },
  style,
});
const otherTopmost = Object.freeze({
  id: "line:topmost",
  kind: "line",
  start: { x: 200, y: 250 },
  end: { x: 350, y: 250 },
  style,
});
const overlapPoint = Object.freeze({ x: 250, y: 250 });
assert.equal(
  drawing.hitTestDrawingSelectedElementPickup(selectedLarge, overlapPoint, screenPadding, viewportScale),
  true,
  "overlap fixture is inside the selected fallback bounds",
);
assert.equal(
  drawing.hitTestDrawingSceneTopmost(drawing.createDrawingScene([selectedLarge, otherTopmost]), overlapPoint)?.id,
  otherTopmost.id,
  "canonical actual topmost object wins inside selected bounds",
);

assert.equal(packageJson.dependencies["lucide-react-native"], "^1.24.0", "existing Lucide dependency is reused");
assert.match(editor, /import \{[^\n]*\bHand\b[^\n]*\} from "lucide-react-native"/u, "Selection uses installed Hand icon");
assert.doesNotMatch(editor, /\bMousePointer2\b/u, "desktop cursor Selection icon is absent");
assert.match(editor, /accessibilityLabel="선택 및 이동"[^\n]*<Hand/u, "Selection terminology and hand icon share one top-level control");
assert.match(editor, /function IconTool[\s\S]*accessibilityRole="button"[\s\S]*accessibilityState=\{\{ disabled: props\.disabled, selected: props\.selected \}\}/u, "button role, disabled, and active state remain canonical");
assert.match(editor, /iconTool: \{[^\n]*minHeight: WAFL_THEME\.touch\.minimum/u, "minimum touch target remains token-owned");
for (const retainedIcon of ["Eraser", "Undo2", "Redo2", "Trash2", "BrushCleaning"]) {
  assert.match(editor, new RegExp(`<${retainedIcon}\\b`, "u"), `${retainedIcon} toolbar icon is unchanged`);
}
assert.match(projection, /resolveDrawingElementWorldBounds\(element, DRAWING_SELECTION_OUTLINE_PADDING_WORLD\)/u, "visible outline uses the canonical bounds owner and exported padding token");
assert.match(editor, /DRAWING_SELECTION_PICKUP_SCREEN_PADDING = WAFL_THEME\.spacing\.sm/u, "forgiving padding derives from a shared screen token");
assert.doesNotMatch(editor, /(?:iPhone|iPad|deviceModel).*PICKUP/iu, "pickup has no device/model branch");

const selectionBranch = editor.slice(editor.indexOf('if (toolRef.current === "selection") {', editor.indexOf("onPanResponderGrant")), editor.indexOf('if (toolRef.current === "eraser")', editor.indexOf("onPanResponderGrant")));
assert.ok(selectionBranch.indexOf("hitTestDrawingSceneTopmost") < selectionBranch.indexOf("hitTestDrawingSelectedElementPickup"), "actual topmost hit runs before selected pickup fallback");
assert.match(selectionBranch, /const selectedPickup = actualHit === null[\s\S]*hitTestDrawingSelectedElementPickup/u, "fallback runs only when actual hit is absent");
assert.match(selectionBranch, /const moveTarget = actualHit \?\? \(selectedPickup \? selectedElement : null\)/u, "actual hit owns overlap precedence and true empty stays null");
assert.match(selectionBranch, /selectElement\(moveTarget\?\.id \?\? null\)/u, "only true empty deselects");
assert.match(selectionBranch, /selectionMoveGestureRef\.current = moveTarget/u, "same selected fallback and unselected actual hit arm the existing Move session");
assert.match(editor, /DRAWING_SELECTION_MOVE_SCREEN_SLOP = WAFL_THEME\.spacing\.sm/u, "existing A76 drag slop remains unchanged");
assert.match(editor, /setSelectionMovePreviewScene\(planSelectionMove/u, "pointerMove remains transient preview only");
assert.match(editor, /displayedScene = selectionMovePreviewScene \?\? eraserPreviewScene \?\? currentScene/u, "preview replaces original without duplication");
assert.match(editor, /displayedSelectedElement[\s\S]*projectDrawingSelectionOutline\(displayedSelectedElement/u, "outline follows preview geometry");
assert.match(editor, /if \(nextScene !== null\) updateHistory\(commitDrawingScene/u, "meaningful release remains one Scene/history commit");
assert.match(editor, /if \(toolRef\.current === "selection"\)[\s\S]*return;/u, "Selection Move cannot enter Text keyboard authoring");
assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u, "Scene schema v1 remains unchanged");
for (const forbidden of ["크기 조절", "회전", "다중 선택", "올가미", "확대", "축소"]) {
  assert.doesNotMatch(editor, new RegExp(`accessibilityLabel="${forbidden}"`, "u"));
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-selection-move-pickup-ux",
  previousPermanentInventoryRetained: 278,
  addedPermanentChecks: 1,
  finalPermanentInventory: 279,
  assertionsMinimum: 56,
  sceneSchemaVersion: 1,
  migrationDelta: 0,
  dependencyDelta: 0,
  nativeConfigEasApiSchemaDelta: "0/0/0/0/0",
  physicalResultInferred: false,
}));

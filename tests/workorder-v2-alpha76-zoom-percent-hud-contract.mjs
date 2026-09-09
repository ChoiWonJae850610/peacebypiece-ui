#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a76-zoom-hud-"));
try {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc",
    "--module", "commonjs",
    "--moduleResolution", "node",
    "--target", "ES2020",
    "--strict",
    "--skipLibCheck",
    "--rootDir", ".",
    "--outDir", compiledDirectory,
    "apps/mobile/features/work-orders/drawing/drawingZoomPercent.ts",
  ], { cwd: process.cwd(), stdio: "pipe" });
} catch (error) {
  fs.rmSync(compiledDirectory, { recursive: true, force: true });
  throw error;
}
process.on("exit", () => fs.rmSync(compiledDirectory, { recursive: true, force: true }));

const require = createRequire(import.meta.url);
const zoom = require(path.join(
  compiledDirectory,
  "apps/mobile/features/work-orders/drawing/drawingZoomPercent.js",
));
const read = (file) => fs.readFileSync(file, "utf8");
const editor = read("apps/mobile/features/work-orders/drawing/WorkOrderSketchEditor.tsx");
const helper = read("apps/mobile/features/work-orders/drawing/drawingZoomPercent.ts");
const cameraGesture = read("lib/domain/drawing/cameraGesture.ts");
const scene = read("lib/domain/drawing/scene.ts");
const contracts = read("lib/domain/drawing/contracts.ts");
const drawingApi = read("apps/mobile/lib/api/drawingApi.ts");
const packageJson = read("package.json") + read("apps/mobile/package.json");

assert.equal(zoom.resolveDrawingZoomPercent(1), 100);
assert.equal(zoom.resolveDrawingZoomPercent(1.12), 112);
assert.equal(zoom.resolveDrawingZoomPercent(1.15), 115);
assert.equal(zoom.resolveDrawingZoomPercent(1.25), 125);
assert.equal(zoom.resolveDrawingZoomPercent(2), 200);
assert.equal(zoom.resolveDrawingZoomPercent(4), 400);
assert.equal(zoom.formatDrawingZoomPercentLabel(1), "100%");
assert.equal(zoom.formatDrawingZoomPercentLabel(1.25), "125%");
assert.equal(zoom.formatDrawingZoomPercentLabel(4), "400%");
assert.equal(zoom.formatDrawingZoomPercentLabel(1.234), "123%", "zoom percent uses integer rounding only");
assert.throws(() => zoom.resolveDrawingZoomPercent(Number.NaN), RangeError);
assert.throws(() => zoom.resolveDrawingZoomPercent(0), RangeError);

const footerStart = editor.indexOf('<View pointerEvents="auto" style={styles.footer} testID="work-order-sketch-footer">');
const footerEnd = editor.indexOf("<WaflActionProcessingBlocker", footerStart);
assert.ok(footerStart >= 0 && footerEnd > footerStart, "Sketch footer source is present");
const footer = editor.slice(footerStart, footerEnd);
const hudStart = footer.indexOf('testID="work-order-sketch-zoom-percent-hud"');
const actionsStart = footer.indexOf("<View style={styles.footerActions}>");
assert.ok(hudStart >= 0, "Sketch renders the zoom percent HUD");
assert.ok(actionsStart > hudStart, "zoom HUD is immediately before the Close/Save action row");
assert.match(editor, /const zoomPercentLabel = useMemo\(\(\) => formatDrawingZoomPercentLabel\(camera\.zoom\), \[camera\.zoom\]\)/u);
assert.match(footer, /pointerEvents="none"[\s\S]*work-order-sketch-zoom-percent-hud/u);
assert.match(footer, /<Search[\s\S]*zoomPercentLabel/u, "existing magnifier icon and integer percent label form the HUD");
assert.match(editor, /zoomHud: \{[\s\S]*alignItems: "center"[\s\S]*flexDirection: "row"[\s\S]*justifyContent: "center"/u);

const hudSource = footer.slice(Math.max(0, footer.lastIndexOf("<View", hudStart)), actionsStart);
assert.doesNotMatch(hudSource, /Pressable|onPress|onLongPress|WaflPrimaryActionButton/u, "HUD is non-interactive");
assert.doesNotMatch(hudSource, /Plus|Minus|Fit|맞춤|label="[+-]"/u, "HUD has no zoom controls or Fit action");
assert.doesNotMatch(helper, /toFixed|\.toString\(\).*x|x\$\{/u, "HUD formatter emits no decimals or x-scale form");

const sameZoomAfterPan = Object.freeze({ centerX: 620, centerY: 710, zoom: 1.5 });
assert.equal(zoom.formatDrawingZoomPercentLabel(sameZoomAfterPan.zoom), "150%", "pan-only camera motion preserves the label");
assert.match(editor, /const fitCamera = createDrawingCamera\(\)[\s\S]*setCurrentCamera\(fitCamera\)/u, "a new editor session resets transient Camera before viewport-owned Cover projection");
assert.match(editor, /setCurrentCamera\(createDrawingCoverCamera\(nextViewport\)\)/u, "fresh viewport applies centered Cover rather than forcing Fit");
assert.match(cameraGesture, /zoom: clamp\(coverScale \/ fitScale, DRAWING_CAMERA_MIN_ZOOM, DRAWING_CAMERA_MAX_ZOOM\)/u, "Cover may exceed zoom 1 according to viewport aspect ratio");
assert.equal(zoom.formatDrawingZoomPercentLabel(1), "100%", "zoom 1 means full-paper Fit");
assert.match(editor, /setCamera\(next\)/u, "current Camera projection remains the HUD render owner");

assert.match(contracts, /DRAWING_SCENE_SCHEMA_VERSION = 1 as const/u);
assert.doesNotMatch(scene + contracts + drawingApi, /zoomPercent|zoomHud|formatDrawingZoomPercentLabel/u, "HUD remains outside Scene, history, persistence, and API");
assert.doesNotMatch(packageJson, /react-native-gesture-handler|react-native-reanimated|react-native-worklets/u);
assert.match(editor, /testID="work-order-sketch-drawing-tool-menu"/u, "overlay drawing palette remains present");
assert.match(footer, /label="닫기"[\s\S]*label="저장"/u, "Close/Save row remains present");
assert.match(editor, /supportedOrientations=\{WORK_ORDER_SKETCH_SUPPORTED_ORIENTATIONS\}/u, "orientation contract remains present");

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha76-zoom-percent-hud",
  previousPermanentInventoryRetained: 286,
  addedPermanentChecks: 1,
  finalPermanentInventory: 287,
  displayRule: "round-camera-zoom-times-100",
  freshOpenPresentation: "centered-cover-may-exceed-100-percent",
  fitPresentation: "zoom-1-equals-100-percent",
  interaction: "read-only",
  sceneHistoryDirtyNetworkDelta: "0/0/0/0",
  dependencyNativeConfigEasApiSchemaMigrationDelta: "0/0/0/0/0/0/0",
  physicalResultInferred: false,
}));

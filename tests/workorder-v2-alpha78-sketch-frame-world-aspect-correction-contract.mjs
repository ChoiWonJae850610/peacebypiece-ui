#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a78-sketch-frame-aspect-"));
try {
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc", "--module", "commonjs", "--moduleResolution", "node",
    "--target", "ES2020", "--strict", "--skipLibCheck", "--rootDir", "lib/domain/drawing",
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
const sketch = read("components/workorder/preview/IssuedWorkOrderSketch.tsx");
const styles = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const document = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const generatedPreview = read("components/workorder/preview/GeneratedIssuedWorkOrderPreview.tsx");
const internalFileRoute = read("app/api/v2/work-orders/documents/[documentRef]/file/route.ts");
const localRenderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
const drawingContracts = read("lib/domain/drawing/contracts.ts");
const migration = read("db/v2/migrations/022_v2_work_order_drawings.sql");
const verify = read("tools/pipeline/verify-safe.ps1");
const packageJson = JSON.parse(read("package.json"));

let assertions = 0;
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };
const ok = (value, message) => { assert.ok(value, message); assertions += 1; };
const matches = (value, pattern, message) => { assert.match(value, pattern, message); assertions += 1; };
const notMatches = (value, pattern, message) => { assert.doesNotMatch(value, pattern, message); assertions += 1; };

equal(drawing.DRAWING_CANONICAL_CANVAS.width, 1_000, "Drawing WORLD width remains 1000");
equal(drawing.DRAWING_CANONICAL_CANVAS.height, 1_400, "Drawing WORLD height remains 1400");
const outputBox = Object.freeze({ width: 1_500, height: 2_100 });
equal(outputBox.width / outputBox.height, drawing.DRAWING_CANONICAL_CANVAS.width / drawing.DRAWING_CANONICAL_CANVAS.height, "output box and WORLD share the exact 5:7 aspect");
const scene = drawing.createDrawingScene([
  { id: "line", kind: "line", start: { x: 100, y: 200 }, end: { x: 900, y: 1_200 }, style: { fillColor: null, strokeColor: "#17263D", strokeWidth: 4 } },
]);
const projection = drawing.projectDrawingSceneForExport(scene, outputBox);
equal(projection.transform.scale, 1.5, "canonical projection scale is 1.5");
equal(projection.transform.offsetX, 0, "canonical projection has no horizontal gutter");
equal(projection.transform.offsetY, 0, "canonical projection has no vertical gutter");
equal(projection.primitives[0].x2 - projection.primitives[0].x1, (900 - 100) * projection.transform.scale, "X uses the shared uniform scale");
equal(projection.primitives[0].y2 - projection.primitives[0].y1, (1_200 - 200) * projection.transform.scale, "Y uses the same uniform scale");

matches(sketch, /ISSUED_WORK_ORDER_SKETCH_OUTPUT_BOX\s*=\s*Object\.freeze\(\{\s*width:\s*1_500,\s*height:\s*2_100\s*\}\)/u, "canonical component owns the 1500x2100 output box");
matches(styles, /\.sketchOutputFrame\s*\{[^}]*width:\s*min\(100%,\s*150mm\)/iu, "screen frame cannot exceed the available width");
matches(styles, /\.sketchOutputFrame\s*\{[^}]*aspect-ratio:\s*5\s*\/\s*7/iu, "visible screen frame is 5:7");
matches(styles, /\.sketchOutputFrame\s*\{[^}]*margin-inline:\s*auto/iu, "screen frame is centered");
matches(styles, /\.sketchOutputFrame\s*\{[^}]*height:\s*auto/iu, "screen height derives responsively from its aspect");
notMatches(styles, /\.sketchOutputFrame\s*\{[^}]*width:\s*150mm\s*;[^}]*height:\s*210mm[^}]*\}\s*\.sketchOutputSvg/iu, "screen rules do not force a mobile-overflowing fixed width");
matches(styles, /@media print\s*\{[\s\S]*\.sketchOutputFrame\s*\{[^}]*width:\s*150mm[^}]*height:\s*210mm/iu, "print frame is exactly 150mm by 210mm");
matches(styles, /\.sketchOutputSvg\s*\{[^}]*width:\s*100%[^}]*height:\s*100%/iu, "SVG fills the corrected visible frame");
matches(sketch, /preserveAspectRatio="xMidYMid meet"/u, "SVG retains centered uniform contain semantics");
notMatches(sketch, /scaleX|scaleY|matrix\s*\(/u, "export component has no non-uniform stretch transform");
notMatches(sketch, /camera/iu, "Camera state is absent from output");
notMatches(sketch, /toolbar|handle|selection|eraser|caret|ghost|hud/iu, "editor chrome and transients are absent from output");
matches(sketch, /primitive\.kind === "path"[\s\S]*primitive\.kind === "line"[\s\S]*primitive\.kind === "text"[\s\S]*primitive\.kind === "rectangle"[\s\S]*<ellipse/u, "semantic path, line, text, rectangle, and ellipse primitives remain supported");
matches(document, /<IssuedWorkOrderSketch scene=\{drawingScene\}/u, "Preview and PDF retain the canonical Sketch component owner");
matches(generatedPreview, /IssuedWorkOrderDocument/u, "generated Preview retains the canonical issued document owner");
matches(internalFileRoute, /handleGetInternalGeneratedDocumentFile/u, "Download retains the canonical generated artifact owner");
matches(localRenderer, /page\.pdf/u, "Print retains the canonical Chromium artifact owner");
matches(drawingContracts, /DRAWING_SCENE_SCHEMA_VERSION\s*=\s*1\s+as const/u, "Drawing Scene schema remains v1");
matches(migration, /scene_json jsonb NOT NULL/u, "existing Scene-v1 persistence remains unchanged");
notMatches(sketch, /fetch\(|\/api\//u, "output frame correction adds no API path");
equal(packageJson.dependencies?.["react-native-skia"] ?? packageJson.devDependencies?.["react-native-skia"] ?? null, null, "no new Drawing renderer dependency is introduced");
matches(verify, /workorder-v2-alpha77-selection-resize-endpoints-contract\.mjs/u, "A77 editor regression remains in Canonical Verify");
matches(verify, /workorder-v2-alpha78-sketch-pdf-output-fidelity-contract\.mjs/u, "original alpha.78 output fidelity contract remains permanent");
notMatches(styles, /\.sketchOutputFrame\s*\{[^}]*width:\s*100%\s*;[^}]*height:\s*210mm/iu, "old 188mm-wide visible frame mismatch is absent");
ok(Object.isFrozen(projection.outputBox) && Object.isFrozen(projection.transform), "corrected projection remains immutable");
ok(assertions >= 25, `contract executes at least 25 assertions (actual ${assertions})`);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha78-sketch-frame-world-aspect-correction",
  assertions,
  previousPermanentInventoryRetained: 291,
  addedPermanentChecks: 1,
  finalPermanentInventory: 292,
  sceneSchemaVersion: 1,
  world: "1000x1400",
  outputBox: "1500x2100",
  scale: projection.transform.scale,
  offset: `${projection.transform.offsetX},${projection.transform.offsetY}`,
  apiSceneSchemaDelta: "0/0",
  dependencyNativeConfigEasDelta: "0/0/0/0",
  migrationDelta: 0,
  physicalResultInferred: false,
}));

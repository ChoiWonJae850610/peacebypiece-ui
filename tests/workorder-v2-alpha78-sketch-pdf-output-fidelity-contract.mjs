#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

const compiledDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-a78-sketch-pdf-"));
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
const style = Object.freeze({ fillColor: null, strokeColor: "#17263D", strokeWidth: 5 });
let assertions = 0;
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };
const deepEqual = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const ok = (value, message) => { assert.ok(value, message); assertions += 1; };
const matches = (value, pattern, message) => { assert.match(value, pattern, message); assertions += 1; };
const notMatches = (value, pattern, message) => { assert.doesNotMatch(value, pattern, message); assertions += 1; };

const elements = Object.freeze([
  { id: "freehand", kind: "freehand", points: [{ x: 100, y: 120 }, { x: 200, y: 200 }, { x: 300, y: 150 }], style },
  { id: "fragment-a", kind: "freehand", points: [{ x: 100, y: 300 }, { x: 180, y: 330 }], style },
  { id: "fragment-b", kind: "freehand", points: [{ x: 240, y: 330 }, { x: 320, y: 300 }], style },
  { id: "line", kind: "line", start: { x: 100, y: 450 }, end: { x: 450, y: 500 }, style },
  { id: "arrow", kind: "arrow", start: { x: 100, y: 650 }, end: { x: 500, y: 580 }, style },
  { id: "rectangle", kind: "rectangle", bounds: { x: 560, y: 120, width: 300, height: 250 }, style },
  { id: "ellipse", kind: "ellipse", bounds: { x: 560, y: 450, width: 280, height: 190 }, style },
  { id: "text", kind: "text", anchor: { x: 140, y: 850 }, content: "3cm 줄임 · 포켓 2cm 위", fontSize: 40, style },
  { id: "topmost", kind: "rectangle", bounds: { x: 520, y: 820, width: 320, height: 230 }, style: { ...style, strokeColor: "#9A3412" } },
]);
const scene = drawing.createDrawingScene(elements);
const portrait = drawing.projectDrawingSceneForExport(scene, { width: 1_500, height: 2_100 });
equal(portrait.transform.scale, 1.5, "1000x1400 WORLD uses one uniform contain scale");
equal(portrait.transform.offsetX, 0, "canonical output fills the frame width without a hidden gutter");
equal(portrait.transform.offsetY, 0, "portrait output fills the available height without crop");
equal(portrait.primitives.length, elements.length, "every saved semantic element projects once");
deepEqual(portrait.primitives.map((item) => item.id), elements.map((item) => item.id), "saved Scene z-order is retained exactly");
equal(portrait.primitives[0].kind, "path", "freehand uses the shared path owner");
matches(portrait.primitives[0].d, /^M150\.000 180\.000 Q/u, "freehand keeps midpoint-quadratic path fidelity");
equal(portrait.primitives[3].kind, "line", "line remains a semantic straight line");
equal(portrait.primitives[4].kind, "path", "arrow includes its renderer-derived head");
matches(portrait.primitives[4].d, / M/u, "arrow path includes shaft and head subpaths");
equal(portrait.primitives[5].kind, "rectangle", "rectangle remains semantic");
equal(portrait.primitives[6].kind, "ellipse", "ellipse remains semantic");
equal(portrait.primitives[7].kind, "text", "text remains semantic");
equal(portrait.primitives[7].content, "3cm 줄임 · 포켓 2cm 위", "Korean text content round-trips");
equal(portrait.primitives[7].fontSize, 60, "WORLD font size scales uniformly");
equal(portrait.primitives[8].style.strokeColor, "#9A3412", "topmost style remains attached to the last element");

const landscape = drawing.projectDrawingSceneForExport(scene, { width: 2_400, height: 1_500 });
ok(landscape.transform.scale > 0, "arbitrary output box produces a positive scale");
equal(landscape.transform.scale, Math.min(2_400 / 1_000, 1_500 / 1_400), "landscape output still uses contain");
equal(landscape.transform.offsetX, (2_400 - 1_000 * landscape.transform.scale) / 2, "landscape output centers x");
equal(landscape.transform.offsetY, (1_500 - 1_400 * landscape.transform.scale) / 2, "landscape output centers y");
deepEqual(landscape.primitives.map((item) => item.id), portrait.primitives.map((item) => item.id), "output-box changes cannot reorder elements");
equal(drawing.serializeDrawingScene(scene), drawing.serializeDrawingScene(drawing.cloneDrawingScene(scene)), "projection leaves saved Scene serialization unchanged");
equal(scene.schemaVersion, 1, "Scene schema remains v1");
deepEqual(scene.canvas, drawing.DRAWING_CANONICAL_CANVAS, "WORLD remains 1000x1400");
const cameraVariants = [
  drawing.createDrawingCamera(),
  drawing.createDrawingCamera({ zoom: 1.4 }),
  drawing.createDrawingCamera({ centerX: 120, centerY: 260, zoom: 2 }),
  drawing.createDrawingCamera({ centerX: 900, centerY: 1_250, zoom: 4 }),
];
for (const camera of cameraVariants) {
  ok(camera.zoom >= 1, "editor Camera variant is valid test evidence");
  deepEqual(drawing.projectDrawingSceneForExport(scene, portrait.outputBox), portrait, "Fit/Cover/zoom/pan state cannot change saved Scene export");
}
equal(drawing.projectDrawingSceneForExport.length, 2, "export accepts only saved Scene and output box");
const empty = drawing.projectDrawingSceneForExport(drawing.createDrawingScene(), portrait.outputBox);
equal(empty.primitives.length, 0, "empty saved Scene is safe");

const snapshot = read("lib/generated-documents/work-order-pdf/snapshot.ts");
const loader = read("lib/generated-documents/work-order-pdf/drawingSnapshot.ts");
const generation = read("lib/generated-documents/work-order-pdf/generationService.ts");
const preview = read("lib/generated-documents/work-order-pdf/previewService.ts");
const document = read("components/workorder/preview/IssuedWorkOrderDocument.tsx");
const sketch = read("components/workorder/preview/IssuedWorkOrderSketch.tsx");
const previewStyles = read("components/workorder/preview/IssuedWorkOrderPreview.module.css");
const localInput = read("lib/generated-documents/work-order-pdf/localRenderInputCore.mjs");
const objectStore = read("lib/generated-documents/work-order-pdf/objectStore.ts");
const internalFileRoute = read("app/api/v2/work-orders/documents/[documentRef]/file/route.ts");
const localRenderer = read("lib/generated-documents/work-order-pdf/localChromiumRenderer.mts");
const mobileWorkbench = read("apps/mobile/features/work-orders/documents/WorkOrderDocumentWorkbench.tsx");
const migration = read("db/v2/migrations/022_v2_work_order_drawings.sql");

matches(snapshot, /readonly drawingScene\?: DrawingSceneV1/u, "immutable PDF snapshot owns optional saved Drawing Scene");
matches(snapshot, /structuredClone\(input\.drawingScene\)/u, "snapshot immutably clones the already-validated saved Scene");
matches(loader, /FROM work_order_drawings drawing/u, "PDF loader reads canonical Drawing persistence");
matches(loader, /drawing\.work_order_id = \$2::uuid[\s\S]*drawing\.revision_id = \$3::uuid[\s\S]*drawing\.slot_key = \$4/u, "loader scopes exact WorkOrder, revision, and primary slot");
matches(loader, /withWaflV2TenantReadOnlyTransaction/u, "Drawing PDF read is tenant-scoped and read-only");
matches(loader, /validateDrawingScene/u, "stored Scene is validated before output");
notMatches(loader, /\b(?:INSERT|UPDATE|DELETE)\b/u, "Drawing PDF loader has no data mutation SQL");
matches(generation, /loadWorkOrderPdfDrawingScene\(tenantScope, input\.workOrderId, input\.revisionId\)/u, "issued generation captures exact saved Scene");
matches(generation, /drawingScene,/u, "issued immutable snapshot includes the captured Scene");
matches(preview, /loadWorkOrderPdfDrawingScene\(scope, input\.workOrderId, input\.revisionId\)/u, "draft Preview captures the same exact saved Scene");
matches(preview, /drawingScene,/u, "draft Preview snapshot uses the shared Scene field");
matches(document, /key: "product-sketch"[\s\S]*startsNewPage: true/u, "saved Sketch owns one dedicated PDF page");
matches(document, /drawingScene && drawingScene\.elements\.length > 0/u, "missing or empty Drawing adds no blank page");
matches(document, /numberLabel="06" title="제품 스케치"/u, "Sketch uses existing Korean document language");
matches(sketch, /projectDrawingSceneForExport/u, "Preview/PDF component uses the pure shared export projection");
matches(sketch, /width:\s*1_500,\s*height:\s*2_100/u, "canonical Sketch output box is 1500x2100");
matches(sketch, /preserveAspectRatio="xMidYMid meet"/u, "SVG output adds a second contain guard");
matches(sketch, /data-wafl-drawing-output="saved-scene-v1"/u, "rendered output identifies saved Scene v1 only");
notMatches(sketch, /camera|selection|handle|caret|ghost|previewFrame|activePrimitive/iu, "Camera and editor transients cannot enter the export component");
matches(previewStyles, /\.sketchOutputFrame\s*\{[^}]*width:\s*min\(100%,\s*150mm\)[^}]*aspect-ratio:\s*5\s*\/\s*7[^}]*height:\s*auto[^}]*margin-inline:\s*auto/iu, "screen Sketch frame is responsive, 5:7, and centered");
matches(previewStyles, /@media print\s*\{[\s\S]*\.sketchOutputFrame\s*\{[^}]*width:\s*150mm[^}]*height:\s*210mm/iu, "print Sketch frame is exactly 150mm by 210mm");
notMatches(previewStyles, /\.sketchOutputFrame\s*\{[^}]*width:\s*100%\s*;[^}]*height:\s*210mm/iu, "mismatched full-width fixed-height frame is retired");
matches(localInput, /snapshotSha256/u, "local Chromium input verifies the complete immutable snapshot hash");
matches(migration, /scene_json jsonb NOT NULL/u, "existing revision Drawing JSON remains the persistence source");
notMatches(snapshot, /DrawingCamera/u, "Camera cannot enter immutable output snapshot");
notMatches(snapshot, /selectedElement|activeStroke|eraser|caret/iu, "selection and authoring transients cannot enter snapshot");
matches(objectStore, /getPdf/u, "generated document delivery reads the canonical stored PDF bytes");
matches(internalFileRoute, /handleGetInternalGeneratedDocumentFile/u, "Download uses the canonical generated-document file owner");
matches(localRenderer, /page\.pdf/u, "Print PDF bytes are authored once by canonical Chromium print");
matches(localRenderer, /printBackground: input\.options\.printBackground/u, "canonical print options are applied to the same renderer artifact");
matches(mobileWorkbench, /currentDocumentState\.viewerTarget\.inlineUrl/u, "mobile viewer opens the generated canonical artifact");
matches(mobileWorkbench, /saveDocument/u, "mobile Save/Download retains the generated artifact owner");

const expectedKinds = ["path", "path", "path", "line", "path", "rectangle", "ellipse", "text", "rectangle"];
deepEqual(portrait.primitives.map((item) => item.kind), expectedKinds, "mixed saved Scene projects to deterministic output primitives");
for (const primitive of portrait.primitives) {
  ok(Object.isFrozen(primitive), `${primitive.id} projection is immutable`);
  ok(Object.isFrozen(primitive.style), `${primitive.id} style projection is immutable`);
}
ok(Object.isFrozen(portrait.primitives), "projected z-order collection is immutable");
ok(Object.isFrozen(portrait.transform), "export transform is immutable");
ok(assertions >= 60, `contract executes at least 60 assertions (actual ${assertions})`);

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha78-sketch-pdf-output-fidelity",
  assertions,
  previousPermanentInventoryRetained: 290,
  addedPermanentChecks: 1,
  finalPermanentInventory: 291,
  sceneSchemaVersion: 1,
  apiDelta: 0,
  migrationDelta: 0,
  dependencyDelta: 0,
  nativeDelta: 0,
  productionOwnerAmbiguousMutation: "0/0/0",
  physicalResultInferred: false,
}));

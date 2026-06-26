import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function byteLength(filePath) {
  return fs.statSync(filePath).size;
}

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      results.push(fullPath.replaceAll(path.sep, "/"));
    }
  }
  return results;
}

const editorPath = "components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx";
const primitivesPath = "components/workorder/drawing/workOrderDrawingCanvasPrimitives.tsx";
const auditPath = "docs/audits/source-architecture-cleanup-0.24.23.md";

assert.ok(byteLength(editorPath) < 50_000, "drawing editor should stay below 50KB after primitive extraction");
assert.ok(byteLength(primitivesPath) < 50_000, "new drawing primitive module must stay below 50KB");

const editor = read(editorPath);
const primitives = read(primitivesPath);
assert.ok(editor.includes("from \"./workOrderDrawingCanvasPrimitives\""), "drawing editor must import extracted primitives");
assert.ok(primitives.includes("export type WorkOrderDrawingEditorProps"), "drawing prop type must remain re-exportable");
assert.ok(primitives.includes("export function DrawingIcon"), "drawing icons should live with drawing primitives");

const appSources = ["app", "components", "lib"].flatMap((dir) => walk(dir));
for (const filePath of appSources) {
  const source = read(filePath);
  assert.doesNotMatch(source, /cloudflare\/pdf-generator-worker\.js/, `${filePath} must not depend on deprecated PDF worker entrypoint`);
}

const cloudflareReadme = read("cloudflare/README.md");
assert.ok(cloudflareReadme.includes("cloudflare/pdf-generator-worker/"), "canonical PDF worker folder must be documented");
assert.ok(cloudflareReadme.includes("cloudflare/pdf-generator-worker.js"), "deprecated PDF worker entrypoint must remain explicitly classified");

const pdfClient = read("lib/generated-documents/pdfGeneratorClient.ts");
assert.ok(pdfClient.includes("WAFLOW_PDF_GENERATOR_URL"), "app PDF client must use configured external generator URL");
assert.ok(pdfClient.includes("not_configured"), "PDF client must fail closed when generator is not configured");

const trace = read("lib/debug/trace.ts");
assert.ok(trace.includes("NODE_ENV !== \"production\""), "debug trace must remain production-disabled");
assert.ok(trace.includes("[redacted]"), "debug trace must redact sensitive payload keys");

const audit = read(auditPath);
for (const token of [
  "0.24.23 Source Architecture Cleanup",
  "WorkOrderDrawingCanvasEditor",
  "WaflUiCatalogPage",
  "AdminSettingsHub",
  "joinRequestRepository",
  "production mock/demo/fallback",
  "legacy PDF Worker",
  "central logger",
]) {
  assert.ok(audit.includes(token), `source cleanup audit missing ${token}`);
}

console.log("source architecture cleanup contract: PASS");

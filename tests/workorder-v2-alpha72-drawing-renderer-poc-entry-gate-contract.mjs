#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const compiledRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wafl-drawing-entry-gate-"));
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
process.on("exit", () => fs.rmSync(compiledRoot, { recursive: true, force: true }));

const policy = require(path.join(compiledRoot, "policy.js"));
assert.equal(policy.isDrawingRendererPocEnabled({ authenticated: true, dev: true }), true, "ordinary authenticated DEV Recipe may open PoC");
assert.equal(policy.isDrawingRendererPocEnabled({ authenticated: false, dev: true }), false, "unauthenticated DEV surface remains closed");
assert.equal(policy.isDrawingRendererPocEnabled({ authenticated: true, dev: false }), false, "release/production surface remains closed");

const read = (file) => fs.readFileSync(file, "utf8");
const gate = read("apps/mobile/features/drawing-poc/drawingRendererPocPolicy.ts");
const experience = read("apps/mobile/features/MobileWorkOrderExperience.tsx");
const gallery = read("apps/mobile/features/work-orders/images/WorkOrderImageGallery.tsx");
const modal = read("apps/mobile/features/drawing-poc/DrawingRendererPocModal.tsx");
const mobilePackage = JSON.parse(read("apps/mobile/package.json"));

assert.match(gate, /return input\.dev && input\.authenticated/);
assert.doesNotMatch(gate, /system_admin|\[SIM\]|companyName|role/u);
assert.match(experience, /isDrawingRendererPocEnabled\(\{ authenticated: Boolean\(user\), dev: __DEV__ \}\)/);
assert.doesNotMatch(experience, /isDrawingRendererPocEnabled\([^)]*(?:system_admin|companyName|role)/u);
assert.match(gallery, /disabled=\{!props\.drawingRendererPocEnabled\}/);
assert.match(gallery, /props\.drawingRendererPocEnabled \? "SVG Performance PoC" : "스케치"/);
assert.match(gallery, /"스케치, 준비 중"/);
assert.doesNotMatch(modal, /fetch\(|WorkOrder|expectedVersion|upload|R2|PDF/u);
assert.match(modal, /SVG Drawing Fidelity &amp; Performance PoC/);
assert.doesNotMatch(modal, /Skia|switchRenderer|drawing-poc-renderer-/u);
assert.equal(mobilePackage.dependencies["@shopify/react-native-skia"], undefined);
for (const forbidden of ["react-native-gesture-handler", "react-native-reanimated", "react-native-worklets"]) {
  assert.equal(mobilePackage.dependencies[forbidden], undefined, forbidden);
}

console.log(JSON.stringify({
  ok: true,
  contract: "workorder-v2-alpha72-drawing-renderer-poc-entry-gate",
  previousPermanentInventoryRetained: 223,
  addedPermanentChecks: 1,
  finalPermanentInventory: 224,
  devAuthenticatedOwnerEnabled: true,
  systemAdminRequired: false,
  simCompanyRequired: false,
  releaseEnabled: false,
  businessMutationPath: 0,
  physicalResultInferred: false,
}));

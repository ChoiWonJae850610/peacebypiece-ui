#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const read = (file) => fs.readFileSync(file, "utf8");
const corePath = "lib/generated-documents/work-order-pdf/localRenderInputCore.mjs";
const wrapperPath = "lib/generated-documents/work-order-pdf/localRenderInput.ts";
const routePath = "app/dev/workorder-pdf-render/[runToken]/page.tsx";
const runnerPaths = [
  "scripts/run-wafl-v2-alpha42-pending-pdf-render-readiness.mjs",
  "scripts/run-wafl-v2-alpha42-realistic-issued-embedded-qr-runtime.mjs",
];
const actual = {
  core: read(corePath),
  wrapper: read(wrapperPath),
  route: read(routePath),
  runners: runnerPaths.map(read),
};

function validateBoundary(source) {
  assert.match(source.wrapper, /^import "server-only";/, "next-wrapper-sentinel-missing");
  assert.match(source.wrapper, /from "\.\/localRenderInputCore\.mjs"/, "wrapper-core-reexport-missing");
  assert.doesNotMatch(source.wrapper, /node:fs|node:path|TOKEN_PATTERN|function getLocalIssuedPdfRenderInputPath/, "wrapper-logic-duplicated");
  assert.doesNotMatch(source.core, /server-only|from "next(?:\/|\")|next\/headers|next\/cookies/, "core-next-import-forbidden");
  assert.match(source.core, /node:fs\/promises/);
  assert.match(source.core, /PDF_LOCAL_RENDER_TOKEN_INVALID/);
  assert.match(source.core, /PDF_RENDER_INPUT_NOT_FOUND/);
  assert.match(source.core, /PDF_RENDER_INPUT_INVALID/);
  assert.match(source.core, /actualSnapshotSha256 !== parsed\.snapshotSha256/);
  assert.equal((source.core.match(/\.tmp", "wafl-v2-alpha38", "render-input"/g) ?? []).length, 1, "canonical-input-path-count-mismatch");
  for (const runner of source.runners) {
    assert.match(runner, /localRenderInputCore\.mjs/, "standalone-runner-core-import-missing");
    assert.doesNotMatch(runner, /localRenderInput\.ts/, "standalone-runner-wrapper-import-forbidden");
    assert.doesNotMatch(runner, /server-only/, "standalone-runner-server-only-import-forbidden");
  }
  assert.match(source.route, /from "@\/lib\/generated-documents\/work-order-pdf\/localRenderInput"/, "next-route-wrapper-import-missing");
  assert.doesNotMatch(source.route, /localRenderInputCore/, "next-route-core-import-forbidden");
  assert.match(source.route, /assertLocalOnlyRouteHost\(\)/, "production-local-route-guard-missing");
}

validateBoundary(actual);
assert.throws(() => validateBoundary({ ...actual, runners: [actual.runners[0].replace("localRenderInputCore.mjs", "localRenderInput.ts"), actual.runners[1]] }), /standalone-runner-core-import-missing/);
assert.throws(() => validateBoundary({ ...actual, wrapper: actual.wrapper.replace('import "server-only";\n\n', "") }), /next-wrapper-sentinel-missing/);
assert.throws(() => validateBoundary({ ...actual, core: `${actual.core}\nimport { headers } from "next/headers";` }), /core-next-import-forbidden/);
assert.throws(() => validateBoundary({ ...actual, core: actual.core.replace("wafl-v2-alpha38", "wafl-v2-alpha42") + '\nconst duplicatePath = ".tmp/wafl-v2-alpha38/render-input";' }), /canonical-input-path-count-mismatch/);
assert.throws(() => validateBoundary({ ...actual, route: actual.route.replace("await assertLocalOnlyRouteHost();", "") }), /production-local-route-guard-missing/);

const clientFiles = [
  ...fs.readdirSync("components", { recursive: true }).filter((file) => /\.[cm]?[jt]sx?$/.test(file)).map((file) => path.join("components", file)),
  ...fs.readdirSync("app", { recursive: true }).filter((file) => /\.[cm]?[jt]sx?$/.test(file)).map((file) => path.join("app", file)),
];
for (const file of clientFiles) {
  const source = read(file);
  if (/^["']use client["'];/m.test(source)) {
    assert.doesNotMatch(source, /localRenderInput(?:Core)?/, `client-local-render-input-import-forbidden:${file}`);
  }
}

const imported = await import(pathToFileURL(path.resolve(corePath)).href);
const canonicalSnapshotJson = JSON.stringify({ workOrderId: "work-order", revisionId: "revision" });
const snapshotSha256 = crypto.createHash("sha256").update(Buffer.from(canonicalSnapshotJson, "utf8")).digest("hex");
const runToken = crypto.randomBytes(16).toString("hex");
const input = {
  snapshot: { workOrderId: "work-order", revisionId: "revision" },
  canonicalSnapshotJson,
  snapshotSha256,
  objectKeyPlan: "companies/company/workorders/work-order/pdf/document.pdf",
  representativeImageDataUrl: null,
};
const writtenPath = await imported.writeLocalIssuedPdfRenderInput(runToken, input);
try {
  assert.equal(writtenPath, imported.getLocalIssuedPdfRenderInputPath(runToken));
  assert.deepEqual(await imported.readLocalIssuedPdfRenderInput(runToken), input);
  await assert.rejects(() => imported.writeLocalIssuedPdfRenderInput(runToken, { ...input, snapshotSha256: "0".repeat(64) }), /PDF_RENDER_INPUT_INVALID/);
  assert.throws(() => imported.getLocalIssuedPdfRenderInputPath("invalid"), /PDF_LOCAL_RENDER_TOKEN_INVALID/);
} finally {
  await fsp.rm(writtenPath, { force: true });
}

console.log("workorder v2 alpha.42 local render input boundary contract: PASS");

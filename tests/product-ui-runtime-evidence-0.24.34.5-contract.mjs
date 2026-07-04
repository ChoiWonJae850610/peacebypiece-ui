#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const liveDir = "artifacts/ui-qa/0.24.34.5/live-workorder";
const productDir = "artifacts/ui-qa/0.24.34.5/product-screens";
const pdfDir = "artifacts/pdf-qa/0.24.34.5";
const projects = ["chromium-desktop", "mobile-chromium", "ipad-webkit"];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

for (const project of projects) {
  const manifestPath = path.join(liveDir, `workorder-live-product-manifest-${project}.json`);
  assert.ok(fs.existsSync(manifestPath), `missing live workorder manifest for ${project}`);
  const manifest = readJson(manifestPath);
  const summaryRequests = manifest.observedRequests.filter((request) => request.url.includes("/api/workorders/summary"));
  const detailRequests = manifest.observedRequests.filter(
    (request) =>
      /\/api\/workorders\/wo-/.test(request.url) &&
      !request.url.includes("factory-instruction") &&
      !request.url.includes("generated"),
  );

  assert.equal(manifest.runtimeMode, "development", `${project} must be dev/test runtime evidence`);
  assert.equal(manifest.productionMutation, false, `${project} production mutation must be false`);
  assert.equal(manifest.businessDataMutation, false, `${project} business data mutation must be false`);
  assert.ok(summaryRequests.length > 0, `${project} must start workorder summary fetch`);
  assert.ok(detailRequests.length > 0, `${project} must start workorder detail fetch`);
  assert.equal(manifest.steps.summary?.status, 200, `${project} summary status`);
  assert.equal(manifest.steps.detail?.status, 200, `${project} detail status`);
  assert.equal(manifest.steps.factoryReadBefore?.status, 200, `${project} factory read before status`);
  assert.equal(manifest.steps.factorySave?.status, 200, `${project} factory save status`);
  assert.equal(manifest.steps.factoryReadAfterReload?.status, 200, `${project} factory read after reload status`);
  assert.equal(manifest.steps.factoryReadAfterReload?.persisted, true, `${project} factory persisted`);
  assert.equal(manifest.steps.pdfCreate?.status, 200, `${project} PDF create status`);
  assert.equal(manifest.steps.pdfViewer?.status, 200, `${project} PDF viewer status`);
  assert.match(manifest.steps.pdfViewer?.contentType ?? "", /application\/pdf/, `${project} PDF content type`);
  assert.equal(manifest.pageErrors.length, 0, `${project} page errors`);
  assert.equal(manifest.http4xx5xxCount, 0, `${project} HTTP 4xx/5xx count`);
  assert.ok(fs.existsSync(path.join(liveDir, manifest.screenshots.list)), `${project} list screenshot`);
  assert.ok(fs.existsSync(path.join(liveDir, manifest.screenshots.detail)), `${project} detail screenshot`);
}

for (const project of projects) {
  const manifestPath = path.join(productDir, `product-screen-manifest-${project}.json`);
  assert.ok(fs.existsSync(manifestPath), `missing product screen manifest for ${project}`);
  const manifest = readJson(manifestPath);
  assert.equal(manifest.steps.signupCanonicalPolicyModal, "PASS", `${project} signup canonical policy modal`);
  assert.equal(manifest.steps.systemDashboard, "PASS", `${project} system dashboard`);
  assert.equal(manifest.steps.systemCompaniesRole, "PASS", `${project} system companies role cleanup`);
  assert.equal(manifest.steps.systemSignupReview, "PASS", `${project} system signup review`);
  assert.ok(fs.existsSync(path.join(productDir, manifest.screenshots.signupPolicyModal)), `${project} signup modal screenshot`);
  assert.ok(fs.existsSync(path.join(productDir, manifest.screenshots.systemDashboard)), `${project} system dashboard screenshot`);
  assert.ok(fs.existsSync(path.join(productDir, manifest.screenshots.systemCompanies)), `${project} system companies screenshot`);
  assert.ok(fs.existsSync(path.join(productDir, manifest.screenshots.systemSignupReview)), `${project} system signup review screenshot`);
}

assert.ok(fs.existsSync(path.join(pdfDir, "workorder-live-product.pdf")), "missing workorder PDF artifact");
assert.ok(fs.existsSync(path.join(pdfDir, "workorder-live-product-page-1.png")), "missing workorder PDF page 1 PNG");
assert.ok(fs.existsSync(path.join(pdfDir, "workorder-live-product-page-2.png")), "missing workorder PDF page 2 PNG");

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.34.5.ts", "utf8");
assert.match(roadmap, /PRODUCT_QA_INCOMPLETE/);
assert.doesNotMatch(roadmap, /PRODUCT_QA_AWAITING_USER_REVIEW/);

console.log("product UI runtime evidence 0.24.34.5 contract: PASS");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const manifestPath = process.env.WAFL_PDF_R2_RECONCILIATION_MANIFEST || path.join(".tmp", "pdf-r2-lifecycle-fixtures", "manifest.json");
console.log("PDF/R2 Reconciliation Dry Run");
console.log("Mutation: none");
console.log("Scope: manifest-scoped");

if (!fs.existsSync(manifestPath)) {
  console.log("Manifest: not found");
  console.log("Result: NO_MANIFEST");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const items = Array.isArray(manifest.manifest) ? manifest.manifest : [];
const result = {
  matched: 0,
  missing: 0,
  orphanCandidate: 0,
  metadataOnly: 0,
  objectOnly: 0,
  ignored: items.length,
  blockingReasons: [],
};

if (!items.every((item) => item.headerValid === true || item.name?.startsWith("invalid-"))) {
  result.blockingReasons.push("fixture-header-invalid");
}

console.log(`Manifest: ${manifestPath}`);
console.log(`Matched: ${result.matched}`);
console.log(`Missing: ${result.missing}`);
console.log(`Orphan Candidates: ${result.orphanCandidate}`);
console.log(`Metadata Only: ${result.metadataOnly}`);
console.log(`Object Only: ${result.objectOnly}`);
console.log(`Ignored: ${result.ignored}`);
console.log(`Blocking Reasons: ${result.blockingReasons.join(",") || "none"}`);
console.log(`Result: ${result.blockingReasons.length === 0 ? "PASS" : "FAIL"}`);
process.exit(result.blockingReasons.length === 0 ? 0 : 2);

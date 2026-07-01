#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const manifestPath = process.env.WAFL_PDF_R2_CLEANUP_MANIFEST || path.join(".tmp", "pdf-r2-lifecycle-fixtures", "manifest.json");
console.log("PDF/R2 Exact Cleanup Plan");
console.log("Mutation: none");
console.log("Execution: disabled");
console.log("Policy: exact-key cleanup only; prefix delete and bucket-wide cleanup are forbidden.");

if (!fs.existsSync(manifestPath)) {
  console.log("Manifest: not found");
  console.log("Result: NO_MANIFEST");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const items = Array.isArray(manifest.manifest) ? manifest.manifest : [];
const keyFingerprints = items
  .filter((item) => item.name && item.name.endsWith(".pdf"))
  .map((item) => ({
    name: item.name,
    keyFingerprint: cryptoHash(`companies/example/workorders/example/pdf/${item.name}`),
  }));

console.log(`Manifest: ${manifestPath}`);
console.log(`wouldDeleteR2ExactKeys: ${keyFingerprints.length}`);
console.log("wouldDeleteDbFixtureRows: 0");
console.log("wouldSkip: non-pdf local fixtures");
console.log("blockingReasons: none");
console.log("outOfScope: bucket-wide-scan,prefix-delete,production");
console.log("Result: PLAN_READY");

function cryptoHash(value) {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 12);
}

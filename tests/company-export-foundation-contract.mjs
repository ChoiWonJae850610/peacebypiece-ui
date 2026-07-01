#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("lib/billing/companyExportPolicy.ts", "utf8");
const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.31.ts", "utf8");

for (const token of [
  "COMPANY_EXPORT_DOWNLOAD_TTL_DAYS = 7",
  "COMPANY_EXPORT_PART_SIZE_BYTES = 500 * 1024 * 1024",
  "requested",
  "building",
  "ready",
  "expired",
  "cleanup_pending",
  "splitZipSupported: true",
  "exposesRawR2Url: false",
  "consumesAllowanceOnlyAfterReady: true",
  "finalTerminationExportOutsidePlanAllowance: true",
  "company_wide_export",
]) {
  assert.ok(source.includes(token), `company export policy missing ${token}`);
}

assert.match(roadmap, /Company-wide export foundation/);
assert.doesNotMatch(source, /prefix delete|deletePrefix|signedUrl/i);

console.log("company export foundation contract passed");

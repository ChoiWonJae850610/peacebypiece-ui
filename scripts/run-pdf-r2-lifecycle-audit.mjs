#!/usr/bin/env node
import fs from "node:fs";

const mode = process.argv.includes("--compatibility") ? "compatibility" : "unknown";
const requiredFiles = [
  "lib/workorder/pdf/workOrderPdfPolicy.ts",
  "lib/workorder/generatedDocuments.ts",
  "lib/storage/r2/r2Keys.ts",
  "cloudflare/r2-upload-worker.js",
];

const findings = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) findings.push(`missing:${file}`);
}

const worker = fs.readFileSync("cloudflare/r2-upload-worker.js", "utf8");
if (!worker.includes("WORK_ORDER_PDF_KEY_PATTERN")) findings.push("worker_pdf_key_pattern_missing");
if (!worker.includes('allowedMimeType: "application/pdf"')) findings.push("worker_pdf_mime_policy_missing");
if (/ListObjectsV2Command|prefix delete|deletePrefix/i.test(worker)) findings.push("worker_prefix_cleanup_detected");

console.log("PDF/R2 Lifecycle Compatibility Audit");
console.log(`Mode: ${mode}`);
console.log("Mutation: none");
console.log("Transaction: not opened");
console.log(`Total compatibility findings: ${findings.length}`);
for (const finding of findings) console.log(`Finding: ${finding}`);
console.log(`Result: ${findings.length === 0 ? "PASS" : "FAIL"}`);
process.exit(findings.length === 0 ? 0 : 2);

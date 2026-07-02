#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogSource = fs.readFileSync(path.join(root, "lib/functions/catalog.ts"), "utf8");
const clientSource = fs.readFileSync(path.join(root, "app/functions/FunctionsCatalogClient.tsx"), "utf8");
const verifySafe = fs.readFileSync(path.join(root, "tools/pipeline/verify-safe.ps1"), "utf8");
const approvedWorkflow = fs.readFileSync(path.join(root, "tools/pipeline/approved-workflow.ps1"), "utf8");

for (const token of [
  "export type WaflAutomationSafety",
  "profile: string | null",
  "command: string | null",
  "safety: WaflAutomationSafety",
  "executionNote: string",
  "defaultAutomationProfile",
  "defaultAutomationCommand",
  "defaultAutomationSafety",
  "functions-automation",
]) {
  assert.ok(catalogSource.includes(token), `functions automation catalog token missing: ${token}`);
}

for (const token of [
  "검증 profile",
  "안전 등급",
  "Profile:",
  "명령:",
  "안전장치:",
  "dry-run·confirmation guard",
]) {
  assert.ok(clientSource.includes(token), `functions UI automation token missing: ${token}`);
}

assert.ok(verifySafe.includes('"functions-automation"'), "verify-safe must expose functions-automation profile");
assert.ok(approvedWorkflow.includes('"functions-automation"'), "approved workflow must allow functions-automation profile");
for (const testName of [
  "tests/functions-catalog-structure-contract.mjs",
  "tests/functions-automation-coverage-contract.mjs",
  "tests/functions-public-signup-automation-contract.mjs",
  "tests/functions-storage-contract.mjs",
  "tests/functions-environment-audit-contract.mjs",
  "tests/functions-pdf-contract.mjs",
]) {
  assert.ok(verifySafe.includes(testName), `functions-automation profile missing command: ${testName}`);
}

assert.ok(catalogSource.includes('"dry-run"'), "dry-run tools must be explicit");
assert.ok(catalogSource.includes("confirmation") && catalogSource.includes("guard"), "destructive guard note must be documented");

console.log("[PASS] functions automation coverage contract");

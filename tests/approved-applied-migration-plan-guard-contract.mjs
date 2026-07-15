#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";

const contract = path.resolve("tests/approved-applied-migration-plan-guard-contract.ps1");
const result = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", contract], {
  cwd: process.cwd(),
  encoding: "utf8",
  windowsHide: true,
});

assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
assert.match(result.stdout, /APPROVED_APPLIED_MIGRATION_PLAN_GUARD_CONTRACT: PASS/);
console.log("APPROVED APPLIED MIGRATION PLAN GUARD CONTRACT: PASS");

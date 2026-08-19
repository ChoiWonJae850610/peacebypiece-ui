#!/usr/bin/env node
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";

const contract = path.resolve("tests/approved-applied-migration-plan-guard-contract.ps1");
const windowsRoot = process.env.SystemRoot ?? "C:\\Windows";
const windowsPowerShell = path.join(windowsRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
const windowsPowerShellModules = path.join(windowsRoot, "System32", "WindowsPowerShell", "v1.0", "Modules");
const result = spawnSync(windowsPowerShell, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", contract], {
  cwd: process.cwd(),
  encoding: "utf8",
  windowsHide: true,
  env: {
    ...process.env,
    PSModulePath: [windowsPowerShellModules, process.env.PSModulePath].filter(Boolean).join(path.delimiter),
  },
});

assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
assert.match(result.stdout, /APPROVED_APPLIED_MIGRATION_PLAN_GUARD_CONTRACT: PASS/);
console.log("APPROVED APPLIED MIGRATION PLAN GUARD CONTRACT: PASS");

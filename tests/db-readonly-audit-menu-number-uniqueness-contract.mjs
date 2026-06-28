import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");
const menuBody = script.match(/function ShowDeveloperToolsMenu \{[\s\S]*?\nfunction GetDownloadWatcherProcess/)?.[0] ?? "";
assert.ok(menuBody, "ShowDeveloperToolsMenu body must be present");

const menuNumbers = [...menuBody.matchAll(/Write-Host\s+" ?(\d{1,2})\.\s/g)].map((match) => Number(match[1]));
const switchNumbers = [...menuBody.matchAll(/^\s*(\d{1,2})\s*\{/gm)].map((match) => Number(match[1]));

const duplicateNumbers = (numbers) =>
  [...new Set(numbers.filter((number, index) => numbers.indexOf(number) !== index))].sort((a, b) => a - b);

assert.deepEqual(duplicateNumbers(menuNumbers), [], "developer tools menu numbers must be unique");
assert.ok(menuNumbers.includes(42), "signup compatibility audit menu number 42 must be displayed");
assert.ok(switchNumbers.includes(42), "signup compatibility audit switch case 42 must exist");
assert.ok(menuBody.includes("0~42 범위"), "developer tools menu range must include 42");

const signupSwitch = menuBody.match(/^\s*42\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(signupSwitch, /RunSignupMigrationCompatibilityAudit \| Out-Null/);

console.log("db-readonly-audit-menu-number-uniqueness-contract: PASS");

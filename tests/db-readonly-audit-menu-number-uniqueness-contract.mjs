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
assert.ok(menuNumbers.includes(43), "signup consent compatibility audit menu number 43 must be displayed");
assert.ok(menuNumbers.includes(44), "signup certificate R2 integration menu number 44 must be displayed");
assert.ok(menuNumbers.includes(45), "signup certificate R2 preflight menu number 45 must be displayed");
assert.ok(menuNumbers.includes(46), "signup approval provisioning integration menu number 46 must be displayed");
assert.ok(switchNumbers.includes(42), "signup compatibility audit switch case 42 must exist");
assert.ok(switchNumbers.includes(43), "signup consent compatibility audit switch case 43 must exist");
assert.ok(switchNumbers.includes(44), "signup certificate R2 integration switch case 44 must exist");
assert.ok(switchNumbers.includes(45), "signup certificate R2 preflight switch case 45 must exist");
assert.ok(switchNumbers.includes(46), "signup approval provisioning integration switch case 46 must exist");
assert.ok(menuBody.includes("0~46"), "developer tools menu range must include 46");

const signupSwitch = menuBody.match(/^\s*42\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(signupSwitch, /RunSignupMigrationCompatibilityAudit \| Out-Null/);
const signupConsentSwitch = menuBody.match(/^\s*43\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(signupConsentSwitch, /RunSignupConsentMigrationCompatibilityAudit \| Out-Null/);
const signupCertificateR2Switch = menuBody.match(/^\s*44\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(signupCertificateR2Switch, /RunSignupCertificateR2IntegrationTest \| Out-Null/);
const signupCertificateR2PreflightSwitch = menuBody.match(/^\s*45\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(signupCertificateR2PreflightSwitch, /RunSignupCertificateR2IntegrationPreflight \| Out-Null/);
const signupApprovalProvisioningSwitch = menuBody.match(/^\s*46\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(signupApprovalProvisioningSwitch, /RunSignupApprovalProvisioningIntegration \| Out-Null/);

console.log("db-readonly-audit-menu-number-uniqueness-contract: PASS");

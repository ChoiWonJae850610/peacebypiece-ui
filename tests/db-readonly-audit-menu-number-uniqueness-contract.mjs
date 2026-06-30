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
assert.ok(menuNumbers.includes(47), "system catalog compatibility audit menu number 47 must be displayed");
assert.ok(menuNumbers.includes(48), "system catalog migration apply menu number 48 must be displayed");
assert.ok(menuNumbers.includes(49), "system catalog post-apply audit menu number 49 must be displayed");
assert.ok(menuNumbers.includes(50), "system catalog provisioning integration menu number 50 must be displayed");
assert.ok(switchNumbers.includes(42), "signup compatibility audit switch case 42 must exist");
assert.ok(switchNumbers.includes(43), "signup consent compatibility audit switch case 43 must exist");
assert.ok(switchNumbers.includes(44), "signup certificate R2 integration switch case 44 must exist");
assert.ok(switchNumbers.includes(45), "signup certificate R2 preflight switch case 45 must exist");
assert.ok(switchNumbers.includes(46), "signup approval provisioning integration switch case 46 must exist");
assert.ok(switchNumbers.includes(47), "system catalog compatibility audit switch case 47 must exist");
assert.ok(switchNumbers.includes(48), "system catalog migration apply switch case 48 must exist");
assert.ok(switchNumbers.includes(49), "system catalog post-apply audit switch case 49 must exist");
assert.ok(switchNumbers.includes(50), "system catalog provisioning integration switch case 50 must exist");
assert.ok(menuBody.includes("0~50"), "developer tools menu range must include 50");

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
const systemCatalogCompatibilitySwitch = menuBody.match(/^\s*47\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(systemCatalogCompatibilitySwitch, /RunSystemCatalogCompatibilityAudit \| Out-Null/);
const systemCatalogMigrationSwitch = menuBody.match(/^\s*48\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(systemCatalogMigrationSwitch, /ApplySystemCatalogMigration \| Out-Null/);
const systemCatalogPostApplySwitch = menuBody.match(/^\s*49\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(systemCatalogPostApplySwitch, /RunSystemCatalogPostApplyAudit \| Out-Null/);
const systemCatalogIntegrationSwitch = menuBody.match(/^\s*50\s*\{[^\n]+\}/m)?.[0] ?? "";
assert.match(systemCatalogIntegrationSwitch, /RunSystemCatalogProvisioningIntegration \| Out-Null/);

console.log("db-readonly-audit-menu-number-uniqueness-contract: PASS");

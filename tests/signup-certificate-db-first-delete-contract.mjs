import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/signup/signupApplicationCertificateRepository.ts", "utf8");
const service = fs.readFileSync("lib/signup/signupApplicationCertificateService.ts", "utf8");
const orchestration = fs.readFileSync("lib/signup/signupApplicationCertificateOrchestration.mjs", "utf8");
const route = fs.readFileSync("app/api/signup/application/certificate/route.ts", "utf8");

const serviceDeleteStart = service.indexOf("export async function deleteOwnedSignupApplicationCertificate");
const deleteBody = service.slice(serviceDeleteStart);
const deleteOrchestrationStart = orchestration.indexOf("export async function orchestrateSignupApplicationCertificateDelete");
const deleteOrchestrationBody = orchestration.slice(deleteOrchestrationStart);
const dbDeleteIndex = deleteOrchestrationBody.indexOf("deleteActiveOwnedCertificate");
const cleanupIndex = deleteOrchestrationBody.indexOf("delete-after-metadata-revoke");

assert.match(deleteBody, /orchestrateSignupApplicationCertificateDelete/, "service must use shared delete orchestration");
assert.ok(dbDeleteIndex >= 0, "shared orchestration must call DB inactive mutation");
assert.ok(cleanupIndex > dbDeleteIndex, "R2 cleanup must happen after DB inactive mutation");
assert.match(repository, /FOR UPDATE/, "DB delete must lock the application row");
assert.match(repository, /status IN \('draft', 'changes_requested'\)/, "DB delete must re-check editable status");
assert.match(repository, /UPDATE signup_application_files[\s\S]*SET deleted_at = now\(\)/, "DB delete must mark metadata inactive");
assert.match(service, /SIGNUP_CERTIFICATE_R2_CLEANUP_PENDING/, "R2 cleanup failure must be recorded as cleanup pending");
assert.match(deleteOrchestrationBody, /return null;/, "client should see certificate removed after DB revoke succeeds");
assert.doesNotMatch(deleteOrchestrationBody.slice(0, dbDeleteIndex), /storageAdapter\.delete|deleteUploadedObjectQuietly/, "R2 delete must not run before DB inactive mutation");
assert.match(route, /export async function DELETE/);

console.log("signup certificate DB-first delete contract: OK");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runner = readFileSync("scripts/run-system-catalog-provisioning-integration.mjs", "utf8");
const pipeline = readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");
const migrationRunner = readFileSync("scripts/run-approved-db-migration.mjs", "utf8");
const auditRunner = readFileSync("scripts/run-readonly-db-audit.mjs", "utf8");

assert.match(runner, /WAFL_ENABLE_SYSTEM_CATALOG_INTEGRATION/);
assert.match(runner, /RUN_SYSTEM_CATALOG_PROVISIONING_DEV_TEST/);
assert.match(runner, /DB_FINGERPRINT_MISMATCH/);
assert.match(runner, /BEGIN/);
assert.match(runner, /COMMIT/);
assert.match(runner, /cleanup\(/, "integration runner must clean up fixture rows");
assert.match(runner, /residualDbRows/);
assert.doesNotMatch(runner, /\bR2\b.*put|fetch\(/i, "system catalog integration must not mutate R2");

assert.match(auditRunner, /system-catalog-compatibility/);
assert.match(auditRunner, /system-catalog-post-apply/);
assert.match(migrationRunner, /"system-catalog": "db\/migrations\/patch_0_24_27_system_catalog\.sql"/);

for (const menuNumber of ["47", "48", "49", "50"]) {
  assert.ok(pipeline.includes(`Write-Host "${menuNumber}.`), `missing menu ${menuNumber}`);
  assert.match(pipeline, new RegExp(`\\n\\s*${menuNumber} \\{`), `missing switch ${menuNumber}`);
}
assert.match(pipeline, /RunSystemCatalogCompatibilityAudit/);
assert.match(pipeline, /ApplySystemCatalogMigration/);
assert.match(pipeline, /RunSystemCatalogPostApplyAudit/);
assert.match(pipeline, /RunSystemCatalogProvisioningIntegration/);

console.log("system-catalog-provisioning-integration-runner-contract: PASS");

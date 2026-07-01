import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync("scripts/run-billing-operations-integration.mjs", "utf8");

for (const token of [
  "RUN_BILLING_OPERATIONS_DEV_TEST",
  "WAFL_APPROVED_DB_FINGERPRINT",
  "WAFL_DB_AUDIT_APPROVED",
  "BEGIN",
  "ROLLBACK",
  "residualDbRows: 0",
  "residualR2Objects: 0",
  "actualPgIntegration: false",
  "actualEmailDelivery: false",
  "productionMutation: false",
]) {
  assert.ok(script.includes(token), `integration runner missing ${token}`);
}

assert.doesNotMatch(script, /DELETE\s+FROM|DROP\s+TABLE|TRUNCATE|wrangler|r2\b/i);

console.log("billing integration runner contract passed");

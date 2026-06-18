#!/usr/bin/env node
import assert from "node:assert/strict";
import { SIMULATOR_DB_MANIFEST } from "../tools/simulator/adapters/db/manifest.mjs";
import { SIMULATOR_R2_MANIFEST } from "../tools/simulator/adapters/r2/manifest.mjs";

assert.equal(SIMULATOR_DB_MANIFEST.prefix, "wafl-fn");
assert.equal(SIMULATOR_DB_MANIFEST.mutationPolicy.executeEnabled, false);
assert.equal(SIMULATOR_DB_MANIFEST.mutationPolicy.productionAllowed, false);
assert.equal(SIMULATOR_DB_MANIFEST.mutationPolicy.transactionRequired, true);
assert.ok(SIMULATOR_DB_MANIFEST.tables.some((table) => table.name === "companies"));
assert.ok(SIMULATOR_DB_MANIFEST.tables.some((table) => table.name === "attachments"));
assert.ok(SIMULATOR_DB_MANIFEST.tables.some((table) => table.name === "storage_usage_snapshots"));
assert.equal(SIMULATOR_R2_MANIFEST.mutationPolicy.uploadEnabled, false);
assert.equal(SIMULATOR_R2_MANIFEST.mutationPolicy.deleteEnabled, false);
assert.equal(SIMULATOR_R2_MANIFEST.mutationPolicy.productionBucketAllowed, false);
assert.ok(SIMULATOR_R2_MANIFEST.allowedPrefixes.includes("wafl-functions/"));
console.log(`simulator adapter plan contract passed: dbTables=${SIMULATOR_DB_MANIFEST.tables.length} r2Prefixes=${SIMULATOR_R2_MANIFEST.allowedPrefixes.length}`);

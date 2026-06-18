#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "tools/simulator/commands/db-data.mjs"), "utf8");
assert.match(source, /WAFL_SIMULATOR_ENABLE_DB_MUTATION/);
assert.match(source, /WAFL_SIMULATOR_CONFIRM/);
assert.match(source, /WAFL_SIMULATOR_APPROVED_DB_FINGERPRINT/);
assert.match(source, /approvedDatabaseFingerprint/);
assert.match(source, /runtime === "production"/);
assert.match(source, /BEGIN/);
assert.match(source, /ROLLBACK/);
assert.match(source, /pg_advisory_xact_lock/);
assert.match(source, /DELETE FROM companies WHERE id = ANY/);
assert.match(source, /id LIKE \$2/);
assert.match(source, /ON CONFLICT/);
assert.match(source, /source='manual'/);
assert.match(source, /INSERT INTO company_members/);
assert.match(source, /role === "admin" \? "company_admin" : role/);
console.log("simulator db adapter contract passed: transaction, prefix cleanup, idempotent seed, production block");

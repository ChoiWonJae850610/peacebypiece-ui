#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "scripts/functions-environment-audit.mjs"), "utf8");
const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/functions/company-scenarios.json"), "utf8"));

assert.equal(fixture.idPrefix, "wafl-fn", "test company prefix must stay wafl-fn");
assert.match(source, /runtime ===? "production"|runtime\) && runtime !== "production"/, "production runtime block is required");
assert.match(source, /WAFL_FUNCTIONS_TEST_R2_PREFIX/, "R2 test prefix check is required");
assert.match(source, /DB\/R2.*데이터를 생성·수정·삭제하지 않습니다|DB\/R2.*접속하거나 데이터를/, "audit command must remain non-mutating");
assert.match(source, /seed adapter.*구현|seed adapter.*implemented|Simulator DB seed adapter/, "contract must reflect implemented seed adapter state");
assert.match(source, /cleanup.*fixture.*wafl-fn|cleanup.*transaction/, "contract must reflect implemented cleanup adapter state");
assert.match(source, /host, database, password, and query are not printed/, "DB identity details must be sanitized");
assert.doesNotMatch(source, /host=\$\{databaseIdentity\.host/, "actual DB host must not be printed");
assert.doesNotMatch(source, /database=\$\{databaseIdentity\.database/, "actual DB name must not be printed");
assert.doesNotMatch(source, /S3 bucket=\$\{process\.env\.R2_BUCKET_NAME\}/, "actual R2 bucket must not be printed");

console.log("functions environment audit contract passed: runtime/db/r2/session/prefix/sanitized implemented-adapter state");

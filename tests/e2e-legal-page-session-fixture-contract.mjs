import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./e2e/workspace-policy-settings.spec.mjs", import.meta.url), "utf8");
const start = source.indexOf('test("workspace legal page renders policy documents');
assert.notEqual(start, -1, "legal page E2E scenario must exist");
const block = source.slice(start, source.indexOf('test("workspace settings provides', start));
assert.match(block, /buildCompanyAdminSession\(\)/, "legal page scenario must use a valid company-admin session");
assert.doesNotMatch(block, /buildWorkspaceMemberSession\(\)/, "legal page scenario must not use the invalid null-company member fixture");
console.log("PASS E2E legal page session fixture contract");

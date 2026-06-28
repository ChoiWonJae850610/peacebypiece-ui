import assert from "node:assert/strict";
import fs from "node:fs";

const runner = fs.readFileSync("scripts/run-readonly-db-audit.mjs", "utf8");

assert.ok(runner.includes("const findingModes = new Set(['reconciliation', 'signup-compatibility', 'signup-post-apply'])"));
assert.ok(runner.includes("process.exitCode = totalResultRows > 0 ? 2 : 0"));
assert.ok(runner.includes("Total compatibility findings"));
assert.ok(runner.includes("Result:"));
assert.ok(runner.includes("FAIL"));
assert.ok(runner.includes("PASS"));

assert.match(runner, /if \(mode === 'constraints'\)[\s\S]*process\.exitCode = totalReportedIssues > 0 \? 2 : 0/);
assert.match(runner, /else if \(findingModes\.has\(mode\)\)[\s\S]*process\.exitCode = totalResultRows > 0 \? 2 : 0/);
assert.doesNotMatch(runner, /else \{\s*process\.exitCode = 0;\s*\}/);

console.log("signup read-only audit exit-code contract passed");

import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");

for (const token of [
  "33. Pre-Codex Final Contract Gate",
  "function RunPreCodexFinalContractGate",
  "tests/document-structure-contract.mjs",
  "tests/workspace-commonization-contract.mjs",
  "tests/system-admin-internal-access-contract.mjs",
  "tests/roadmap-development-contract.mjs",
  "tests/unicode-encoding-contract.mjs",
  "Pre_Codex_Final_Contract_Gate",
]) {
  assert.ok(script.includes(token), `pre-Codex menu contract missing ${token}`);
}

assert.ok(script.includes("[안전/비파괴]"), "menu 33 must be classified as safe/non-destructive");
assert.ok(script.includes("0~41 범위"), "developer tools menu input range must include 41");
assert.doesNotMatch(
  script.match(/function RunPreCodexFinalContractGate[\s\S]*?\n}/)?.[0] ?? "",
  /DATABASE_URL|Seed Execute|Cleanup Execute|migration apply|R2 delete/i,
  "pre-Codex gate must not include DB/R2/destructive execution",
);

console.log("pre-Codex final contract gate menu: OK");

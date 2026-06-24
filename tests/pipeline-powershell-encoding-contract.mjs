import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pipelinePath = path.join(root, "tools", "pipeline", "peacebypiece-auto-pipeline.ps1");
const buffer = fs.readFileSync(pipelinePath);

const hasUtf8Bom =
  buffer.length >= 3 &&
  buffer[0] === 0xef &&
  buffer[1] === 0xbb &&
  buffer[2] === 0xbf;

if (!hasUtf8Bom) {
  throw new Error("canonical PowerShell pipeline must be UTF-8 with BOM for Windows PowerShell 5.1");
}

const text = buffer.subarray(3).toString("utf8");

const requiredTokens = [
  "[\\x22\\x27]",
  "$passedMatch = [regex]::Match",
  "$commandMatch = [regex]::Match",
  "$findingCountMatch = [regex]::Match",
  "$highRiskCountMatch = [regex]::Match",
  "any path segment named reports",
  "*.tsbuildinfo",
];

for (const token of requiredTokens) {
  if (!text.includes(token)) {
    throw new Error(`missing pipeline compatibility token: ${token}`);
  }
}

const forbiddenTokens = [
  '[`"\']',
  "$passed = if ($text -match 'Passed=([^;]+)')",
];

for (const token of forbiddenTokens) {
  if (text.includes(token)) {
    throw new Error(`parser-sensitive legacy token remains: ${token}`);
  }
}

console.log("pipeline PowerShell encoding contract: OK");

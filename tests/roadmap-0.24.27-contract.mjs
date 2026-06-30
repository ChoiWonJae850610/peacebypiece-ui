import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const roadmap = readFileSync("lib/internal/roadmap/roadmap-0.24.27.ts", "utf8");
const index = readFileSync("lib/internal/roadmap/index.ts", "utf8");
const version = readFileSync("lib/constants/version.ts", "utf8");

assert.match(version, /APP_VERSION = "0\.24\.27"/);
assert.match(index, /ROADMAP_0_24_27/);
assert.match(index, /currentWorkVersion: "0\.24\.27"/);
assert.match(index, /nextWorkVersion: "0\.24\.28"/);
assert.match(roadmap, /System Catalog, Sizes, and POM/);

for (const criterion of [
  "Three-level category model",
  "underwear",
  "accessories",
  "company catalog",
  "size",
  "POM",
  "provisioning",
  "migration",
  "PowerShell",
]) {
  assert.match(roadmap, new RegExp(criterion, "i"), `roadmap must include ${criterion}`);
}

console.log("roadmap-0.24.27-contract: PASS");

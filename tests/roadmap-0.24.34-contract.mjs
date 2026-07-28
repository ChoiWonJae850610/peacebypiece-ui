#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertHistoricalRoadmapContract } from "./helpers/wafl-historical-roadmap-contract.mjs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.34.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const docs = fs.readFileSync("docs/productization-roadmap.md", "utf8");

assertHistoricalRoadmapContract("0.24.34", { nextVersion: "0.24.35" });
for (const token of [
  "0.24.34",
  "Workorder Size Specification and Incomplete/Final PDF",
  "Workorder size-set selection",
  "Incomplete workorder PDF",
  "Final workorder PDF",
  "0.24.35 - Company-wide Export Execution",
]) {
  assert.ok(roadmap.includes(token), `roadmap 0.24.34 missing token: ${token}`);
}

assert.ok(index.includes("ROADMAP_0_24_34"), "roadmap index must import/register 0.24.34");
assert.ok(docs.includes("0.24.34"), "productization roadmap doc must mention 0.24.34");

console.log("roadmap 0.24.34 contract: OK");

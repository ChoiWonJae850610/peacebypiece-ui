#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertHistoricalRoadmapContract } from "./helpers/wafl-historical-roadmap-contract.mjs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.33.1.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const docs = fs.readFileSync("docs/productization-roadmap.md", "utf8");

assertHistoricalRoadmapContract("0.24.33.1", { nextVersion: "0.24.34" });
for (const token of [
  "0.24.33.1",
  "Authenticated Public Signup E2E and Deployed QA Automation",
  "Dev/test applicant, system-admin, and approved company-admin session fixture route",
  "Chromium, WebKit, mobile, and iPad Playwright project definitions",
  "Actual Google OAuth round-trip",
  "Actual PG integration false",
  "Actual email delivery false",
  "Worker changed false",
]) {
  assert.ok(roadmap.includes(token), `roadmap 0.24.33.1 missing token: ${token}`);
}

assert.ok(index.includes("ROADMAP_0_24_33_1"), "roadmap index must import/register 0.24.33.1");
assert.ok(docs.includes("0.24.33.1"), "productization roadmap doc must mention 0.24.33.1");
assert.ok(!roadmap.includes("0.24.34 implementation"), "0.24.33.1 roadmap must not start 0.24.34");

console.log("roadmap 0.24.33.1 contract: OK");

#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertHistoricalRoadmapContract } from "./helpers/wafl-historical-roadmap-contract.mjs";

const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.34.1.ts", "utf8");
const productizationRoadmap = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const verifySafe = fs.readFileSync("tools/pipeline/verify-safe.ps1", "utf8");

assertHistoricalRoadmapContract("0.24.34.1", { nextVersion: "0.24.35" });
assert.match(index, /ROADMAP_0_24_34_1/);
assert.match(roadmap, /version: "0\.24\.34\.1"/);
assert.match(roadmap, /Public Signup First-Draft Flow Fix and Repo-state Metadata Correction/);
assert.match(roadmap, /0\.24\.35 - Company-wide Export Execution/);
assert.match(roadmap, /No DB migration for 0\.24\.34\.1/);
assert.match(roadmap, /Worker source change\/deploy/);
assert.match(productizationRoadmap, /0\.24\.35` Company-wide Export Execution/);
assert.match(verifySafe, /public-signup-first-draft-fix/);

console.log("roadmap 0.24.34.1 contract: OK");

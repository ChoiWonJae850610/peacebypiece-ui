import assert from "node:assert/strict";
import fs from "node:fs";
import { assertHistoricalRoadmapContract } from "./helpers/wafl-historical-roadmap-contract.mjs";

const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.32.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const doc = fs.readFileSync("docs/productization-roadmap.md", "utf8");

assertHistoricalRoadmapContract("0.24.32", { nextVersion: "0.24.33" });
assert.ok(roadmap.includes('version: "0.24.32"'));
assert.ok(roadmap.includes("PG Billing and Subscription Operations"));
assert.ok(roadmap.includes("Actual PG provider selection"));
assert.ok(roadmap.includes("Actual external email delivery"));
assert.ok(roadmap.includes("db/migrations/patch_0_24_32_billing_operations.sql"));
assert.ok(index.includes("ROADMAP_0_24_32"));
assert.ok(doc.includes("0.24.32 - PG Billing and Subscription Operations"));

console.log("roadmap 0.24.32 contract passed");

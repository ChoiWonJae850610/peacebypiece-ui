#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertHistoricalRoadmapContract } from "./helpers/wafl-historical-roadmap-contract.mjs";

const read = (file) => fs.readFileSync(file, "utf8");

const roadmap = read("lib/internal/roadmap/roadmap-0.24.31.ts");
const index = read("lib/internal/roadmap/index.ts");
const productRoadmap = read("docs/productization-roadmap.md");

assertHistoricalRoadmapContract("0.24.31", { nextVersion: "0.24.32" });
assert.match(roadmap, /version: "0\.24\.31"/);
assert.match(roadmap, /Canonical Policy Conformance Remediation and PG-neutral Billing Foundation/);
assert.match(roadmap, /status: "completed"/);
assert.match(roadmap, /PG-neutral payment method reference policy/);
assert.match(roadmap, /Company-wide export foundation/);
assert.match(roadmap, /Notification outbox template/);
assert.match(roadmap, /Storage full-block coverage/);
assert.match(roadmap, /Actual PG provider selection, SDK/);
assert.doesNotMatch(roadmap, /actual charge implemented|merchant secret configured|production webhook enabled/i);

assert.match(index, /ROADMAP_0_24_31/);

assert.match(productRoadmap, /0\.24\.31` - Canonical Policy Conformance Remediation and PG-neutral Billing Foundation/);
assert.match(productRoadmap, /DB migration execution, production mutation, actual email delivery, Worker source change, and Worker deployment are not part of this version/);

console.log("roadmap 0.24.31 contract passed");

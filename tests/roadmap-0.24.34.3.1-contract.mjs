#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const version = read("lib/constants/version.ts");
const detail = read("lib/internal/roadmap/roadmap-0.24.34.3.1.ts");
const index = read("lib/internal/roadmap/index.ts");
const current = read("docs/codex-current-state.md");
const productization = read("docs/productization-roadmap.md");

assert.match(version, /0\.24\.34\.3\.1/);
assert.match(detail, /Product Completion, Canonical WAFL UI, and Automated Evidence Standard/);
assert.match(detail, /0\.24\.34\.4/);
assert.match(detail, /0\.24\.35 Company-wide Export/);
assert.match(index, /ROADMAP_0_24_34_3_1/);
assert.match(index, /currentWorkVersion: "0\.24\.34\.3\.1"/);
assert.match(index, /nextWorkVersion: "0\.24\.34\.4"/);
assert.match(current, /0\.24\.34\.3\.1/);
assert.match(productization, /0\.24\.34\.3\.1/);
assert.match(productization, /0\.24\.34\.4/);
assert.match(productization, /0\.24\.35.*Company-wide Export Execution/);

console.log("roadmap 0.24.34.3.1 contract: PASS");

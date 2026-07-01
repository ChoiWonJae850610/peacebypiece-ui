#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const repository = fs.readFileSync("lib/catalog/systemCatalogRepository.ts", "utf8");
const roadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.27.ts", "utf8");

assert.match(repository, /UPDATE system_catalog_versions[\s\S]*is_current = false/);
assert.match(repository, /code <> \$1/);
assert.match(repository, /status = CASE WHEN status = 'current' THEN 'archived'/);
assert.match(repository, /INSERT INTO system_catalog_versions/);
assert.match(repository, /ON CONFLICT \(code\) DO UPDATE/);
assert.match(roadmap, /Existing company automatic backfill/);

console.log("system catalog rollover contract passed");

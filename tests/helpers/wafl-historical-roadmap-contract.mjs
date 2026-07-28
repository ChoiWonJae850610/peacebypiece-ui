import assert from "node:assert/strict";
import fs from "node:fs";

import { assertCanonicalWaflVersionConsistency } from "./wafl-v2-current-version.mjs";

const read = (relativePath) => fs.readFileSync(relativePath, "utf8");

export function assertHistoricalRoadmapContract(version, { nextVersion } = {}) {
  assertCanonicalWaflVersionConsistency();

  const detailPath = `lib/internal/roadmap/roadmap-${version}.ts`;
  const detail = read(detailPath);
  const index = read("lib/internal/roadmap/index.ts");
  const historicalRoadmap = read("docs/productization-roadmap.md");
  const symbol = `ROADMAP_${version.replaceAll(".", "_")}`;

  assert.ok(detail.includes(`version: "${version}"`), `${detailPath} must preserve its historical version`);
  assert.ok(index.includes(symbol), `historical roadmap index must preserve ${symbol}`);
  assert.ok(historicalRoadmap.includes(version), `historical roadmap document must preserve ${version}`);

  if (nextVersion) {
    assert.ok(
      detail.includes(nextVersion),
      `${detailPath} must preserve its historical next-version boundary ${nextVersion}`,
    );
    assert.ok(
      historicalRoadmap.includes(nextVersion),
      `historical roadmap document must preserve next-version boundary ${nextVersion}`,
    );
  }

  return detail;
}

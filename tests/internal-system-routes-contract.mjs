import assert from "node:assert/strict";
import fs from "node:fs";

const idControlPage = fs.readFileSync("app/id-control/page.tsx", "utf8");
const devRedirectPage = fs.readFileSync("app/dev/test-console/page.tsx", "utf8");
const idControlClient = fs.readFileSync("app/dev/test-console/DevTestConsoleClient.tsx", "utf8");
const roadmapPage = fs.readFileSync("app/roadmap/page.tsx", "utf8");
const roadmapData = fs.readFileSync("lib/internal/productizationRoadmap.ts", "utf8");
const roadmapDoc = fs.readFileSync("docs/productization-roadmap.md", "utf8");

for (const source of [idControlPage, devRedirectPage, roadmapPage]) {
  assert.match(source, /getCurrentWaflAuthSession/);
  assert.match(source, /isActiveSystemAdminSession/);
  assert.match(source, /notFound\(\)/);
}

assert.match(idControlPage, /isDevTestContextEnabled/);
assert.match(idControlPage, /DevTestConsoleClient/);
assert.match(devRedirectPage, /isDevTestContextEnabled/);
assert.match(devRedirectPage, /redirect\("\/id-control"\)/);
assert.doesNotMatch(devRedirectPage, /return\s+<DevTestConsoleClient/);
assert.match(idControlClient, /href="\/roadmap"/);

assert.match(roadmapPage, /PRODUCTIZATION_ROADMAP/);
assert.match(roadmapPage, /href="\/id-control"/);
assert.doesNotMatch(roadmapPage, /fetch\(/);
assert.doesNotMatch(roadmapPage, /queryDb/);
assert.doesNotMatch(roadmapPage, /createSystemAuditLogSafe/);
assert.doesNotMatch(roadmapPage, /method="post"|method='post'|onSubmit|onClick=\{/);
assert.match(roadmapPage, /WaflPageHero/);
assert.match(roadmapPage, /WaflSectionPanel/);
assert.match(roadmapPage, /AdminStatusBadge/);
assert.match(roadmapPage, /lg:hidden/);
assert.match(roadmapPage, /lg:block/);

for (const token of [
  "completed",
  "in_progress",
  "planned",
  "verification_pending",
  "user_test_needed",
  "user_decision_needed",
  "paused",
  "dbMigration",
  "permissionImpact",
  "r2Impact",
  "automaticTests",
  "manualTests",
  "completedCommit",
]) {
  assert.ok(roadmapData.includes(token), `roadmap data missing ${token}`);
}

assert.match(roadmapDoc, /\/id-control/);
assert.match(roadmapDoc, /\/roadmap/);
assert.match(roadmapDoc, /lib\/internal\/productizationRoadmap\.ts/);

console.log("internal system routes contract passed");

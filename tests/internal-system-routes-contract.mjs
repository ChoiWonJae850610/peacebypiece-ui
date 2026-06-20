import assert from "node:assert/strict";
import fs from "node:fs";

const idControlPage = fs.readFileSync("app/id-control/page.tsx", "utf8");
const devRedirectPage = fs.readFileSync("app/dev/test-console/page.tsx", "utf8");
const idControlClient = fs.readFileSync("app/dev/test-console/DevTestConsoleClient.tsx", "utf8");
const roadmapPage = fs.readFileSync("app/roadmap/page.tsx", "utf8");
const roadmapData = fs.readFileSync("lib/internal/productizationRoadmap.ts", "utf8");
const roadmapDoc = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const verifySafe = fs.readFileSync("tools/pipeline/verify-safe.ps1", "utf8");
const finishVersion = fs.readFileSync("tools/pipeline/finish-version.ps1", "utf8");

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
assert.match(roadmapPage, /제품화 로드맵/);
assert.match(roadmapPage, /버전별 개발 계획과 검증 상태를 확인합니다/);
assert.match(roadmapPage, /현재 앱 버전/);
assert.match(roadmapPage, /앱 기능 개발 진척도/);
assert.match(roadmapPage, /제품화 진척도/);
assert.match(roadmapPage, /현재 작업 버전/);
assert.match(roadmapPage, /대상 버전/);
assert.match(roadmapPage, /작업 내용/);
assert.match(roadmapPage, /현재 상태/);
assert.match(roadmapPage, /우선순위/);
assert.match(roadmapPage, /관련 화면/);
assert.match(roadmapPage, /권한 영향/);
assert.match(roadmapPage, /DB 마이그레이션/);
assert.match(roadmapPage, /DB\/R2 영향/);
assert.match(roadmapPage, /자동 테스트/);
assert.match(roadmapPage, /수동 테스트/);
assert.match(roadmapPage, /완료 커밋/);
assert.match(roadmapPage, /등록된 로드맵 항목이 없습니다/);
assert.doesNotMatch(roadmapPage, />\s*(planned|in_progress|completed|verification_pending|user_decision_needed)\s*</);

for (const token of [
  "completed",
  "in_progress",
  "planned",
  "verification_pending",
  "user_test_needed",
  "user_decision_needed",
  "paused",
  "canceled",
  "dbMigration",
  "dbR2Impact",
  "permissionImpact",
  "r2Impact",
  "automaticTests",
  "manualTests",
  "completedCommits",
  "workItems",
  "relatedScreens",
]) {
  assert.ok(roadmapData.includes(token), `roadmap data missing ${token}`);
}

for (const token of [
  "0.24.10",
  "0.24.11",
  "0.24.12",
  "0.24.13",
  "0.24.14",
  "0.24.15",
  "시스템 관리자 저장공간 사용량 repository를 DB metadata 기반으로 전환",
  "기존 /dev/test-console을 /id-control로 이전",
  "/roadmap 실제 버전별 작업 데이터 표시",
  "Mutation Audit finding 162",
  "Mutation Audit high-risk 0",
  "a4c1921d86e68de27e282150b4195cff27d76d0c",
  "644e8825dafaf38ca0c736eed6c4efcc33fe38d5",
]) {
  assert.ok(roadmapData.includes(token), `roadmap rendering data missing ${token}`);
}

for (const label of ["완료", "진행 중", "예정", "검증 대기", "사용자 테스트 필요", "사용자 결정 필요", "보류", "취소"]) {
  assert.ok(roadmapData.includes(label), `roadmap Korean label missing ${label}`);
}

assert.match(roadmapDoc, /\/id-control/);
assert.match(roadmapDoc, /\/roadmap/);
assert.match(roadmapDoc, /lib\/internal\/productizationRoadmap\.ts/);
assert.match(roadmapDoc, /0\.24\.15/);

assert.match(verifySafe, /id-control-roadmap/);
assert.match(verifySafe, /ChangedFingerprint/);
assert.match(verifySafe, /FindingCount/);
assert.match(verifySafe, /HighRiskCount/);
assert.match(verifySafe, /CHECK_ONLY/);
assert.match(verifySafe, /tests\/internal-system-routes-contract\.mjs/);
assert.match(verifySafe, /tests\/dev-test-context-system-admin-contract\.mjs/);
assert.match(verifySafe, /tests\/simulator-onboarding-fixture-contract\.mjs/);

assert.match(finishVersion, /VerificationProfile/);
assert.match(finishVersion, /ChangedFingerprint/);
assert.match(finishVersion, /HeadHash/);
assert.match(finishVersion, /CheckOnly verification results cannot be used/);
assert.match(finishVersion, /Verification changed fingerprint mismatch/);

console.log("internal system routes contract passed");

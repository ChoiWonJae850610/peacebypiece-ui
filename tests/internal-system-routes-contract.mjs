import assert from "node:assert/strict";
import fs from "node:fs";

const idControlPage = fs.readFileSync("app/id-control/page.tsx", "utf8");
const devRedirectPage = fs.readFileSync("app/dev/test-console/page.tsx", "utf8");
const idControlClient = fs.readFileSync("app/dev/test-console/DevTestConsoleClient.tsx", "utf8");
const roadmapPage = fs.readFileSync("app/roadmap/page.tsx", "utf8");
const roadmapFacade = fs.readFileSync("lib/internal/productizationRoadmap.ts", "utf8");
const roadmapIndex = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const roadmapDraft = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.12.ts", "utf8");
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
assert.doesNotMatch(roadmapPage, /method="post"|method='post'|onSubmit|onClick=\{|useState|useEffect|localStorage|router\.push|searchParams/);
assert.match(roadmapPage, /WaflPageHero/);
assert.match(roadmapPage, /WaflSectionPanel/);
assert.match(roadmapPage, /AdminStatusBadge/);
assert.match(roadmapPage, /상세보기/);
assert.match(roadmapPage, /제품화 로드맵/);
assert.match(roadmapPage, /사용자에게 보이는 버전별 요약/);
assert.match(roadmapPage, /현재 앱 버전/);
assert.match(roadmapPage, /앱 기능 개발 진척도/);
assert.match(roadmapPage, /제품화 진척도/);
assert.match(roadmapPage, /사용자 관점의 목적/);
assert.match(roadmapPage, /사용자에게 보이는 주요 변경/);
assert.match(roadmapPage, /UI가 어떻게 달라지는지/);
assert.match(roadmapPage, /개발 목표/);
assert.match(roadmapPage, /작업 범위/);
assert.match(roadmapPage, /성공 조건/);
assert.match(roadmapPage, /실패 조건/);
assert.match(roadmapPage, /자동 테스트/);
assert.match(roadmapPage, /수동 테스트/);
assert.match(roadmapPage, /commit 및 검증 결과/);
assert.doesNotMatch(roadmapPage, />\s*(planned|in_progress|completed|verification_pending|user_decision_needed)\s*</);

assert.match(roadmapFacade, /from "\.\/roadmap"/);
assert.match(roadmapIndex, /ROADMAP_STATUS_LABELS/);
assert.match(roadmapIndex, /예정/);
assert.match(roadmapIndex, /진행 중/);
assert.match(roadmapIndex, /구현 완료/);
assert.match(roadmapIndex, /검증 대기/);
assert.match(roadmapIndex, /사용자 확인 필요/);
assert.match(roadmapIndex, /사용자 결정 필요/);
assert.match(roadmapIndex, /완료/);
assert.match(roadmapIndex, /보류/);
assert.match(roadmapIndex, /취소/);

for (const token of [
  "0.24.12",
  "일반 사용자 workspace 및 worker 공통화",
  "PC 3패널",
  "iPad mini 가로 2패널",
  "큰 태블릿 가로",
  "모바일과 태블릿 세로",
  "패널 독립 스크롤",
  "/worker",
  "workorder/material-order shell 공통화",
  "single save queue",
  "stale response",
  "toast",
  "refresh persistence",
  "기존 권한 의미 유지",
  "DB Migration 없음",
  "modal/focus",
  "0.24.13",
]) {
  assert.ok(roadmapDraft.includes(token), `0.24.12 roadmap draft missing ${token}`);
}

assert.match(roadmapDoc, /\/id-control/);
assert.match(roadmapDoc, /\/roadmap/);
assert.match(roadmapDoc, /lib\/internal\/roadmap\/index\.ts/);
assert.match(roadmapDoc, /0\.24\.12/);

assert.match(verifySafe, /id-control-roadmap/);
assert.match(verifySafe, /roadmap-development-contract/);
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

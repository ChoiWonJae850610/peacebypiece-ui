import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/roadmap/page.tsx", "utf8");
const types = fs.readFileSync("lib/internal/roadmap/types.ts", "utf8");
const index = fs.readFileSync("lib/internal/roadmap/index.ts", "utf8");
const draft = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.12.ts", "utf8");
const roadmapDoc = fs.readFileSync("docs/productization-roadmap.md", "utf8");
const facade = fs.readFileSync("lib/internal/productizationRoadmap.ts", "utf8");
const workflow = fs.readFileSync("tools/pipeline/approved-workflow.ps1", "utf8");
const pipeline = fs.readFileSync("tools/pipeline/peacebypiece-auto-pipeline.ps1", "utf8");
const readme = fs.readFileSync("tools/pipeline/README.md", "utf8");

for (const field of [
  "version",
  "status",
  "title",
  "userSummary",
  "visibleChanges",
  "expectedUi",
  "developmentPurpose",
  "scope",
  "outOfScope",
  "implementationPrinciples",
  "successConditions",
  "failureConditions",
  "cautions",
  "stopConditions",
  "permissionImpact",
  "dbImpact",
  "r2Impact",
  "migrationRequired",
  "automaticTests",
  "manualTests",
  "expectedChangeAreas",
  "recommendedCommitMessage",
  "nextVersionBoundary",
  "completedSummary",
  "commitHash",
  "verificationResult",
  "remainingIssues",
  "userConfirmationRequired",
  "userConfirmationResult",
]) {
  assert.ok(types.includes(field), `roadmap schema missing ${field}`);
}

for (const statusLabel of ["예정", "진행 중", "구현 완료", "검증 대기", "사용자 확인 필요", "사용자 결정 필요", "완료", "보류", "취소"]) {
  assert.ok(index.includes(statusLabel), `Korean roadmap status label missing ${statusLabel}`);
}

for (const pageToken of [
  "사용자 관점의 목적",
  "사용자에게 보이는 주요 변경",
  "UI가 어떻게 달라지는지",
  "상세보기",
  "개발 목표",
  "개발 관점 UI 구조",
  "작업 범위",
  "제외 범위",
  "구현 원칙",
  "성공 조건",
  "실패 조건",
  "주의사항",
  "중단 조건",
  "권한 영향",
  "DB 영향",
  "R2 영향",
  "Migration 여부",
  "자동 테스트",
  "수동 테스트",
  "예상 변경 영역",
  "완료 처리 조건",
  "완료 결과",
  "commit 및 검증 결과",
  "남은 문제",
  "다음 버전 경계",
]) {
  assert.ok(page.includes(pageToken), `roadmap page missing ${pageToken}`);
}

assert.doesNotMatch(page, /method="post"|method='post'|onSubmit|onClick=\{|useState|useEffect|fetch\(|queryDb|localStorage|router\.push|searchParams/);
assert.match(page, /getRoadmapVersionAnchor/);
assert.match(index, /v-\$\{version\.replace/);
assert.match(facade, /ProductizationRoadmapVersion/);

for (const draftToken of [
  'version: "0.24.12"',
  'status: "user_test_needed"',
  "일반 사용자 workspace 및 worker 공통화",
  "/worker 화면의 크기와 정보 밀도를 줄인다.",
  "태블릿 가로에서 workspace 패널 스크롤을 정상화한다.",
  "작업지시서와 발주서의 화면 구조와 피드백을 통일한다.",
  "저장 중 다른 값이 사라지지 않도록 저장 흐름을 안정화한다.",
  "PC는 목록, 상세, 보조 정보를 한 화면에 두는 3패널",
  "iPad mini 가로",
  "큰 태블릿 가로",
  "모바일과 태블릿 세로",
  "패널 독립 스크롤",
  "/worker는 큰 카드식 밀도를 줄이고",
  "workorder/material-order shell 공통화",
  "single save queue",
  "stale response",
  "toast",
  "refresh persistence",
  "권한 의미를 유지",
  "DB Migration 없음",
  "modal/focus",
  "0.24.13은 기능 개발을 바로 이어가지 않고 문서/폴더 정리 2차",
  "0.24.18은 R2/Simulator 테스트 기반",
  "0.24.19는 workorder/material-order PDF",
]) {
  assert.ok(draft.includes(draftToken), `0.24.12 draft missing ${draftToken}`);
}

const rearrangedRoadmap = [
  ["0.24.13", "문서/폴더 정리 2차"],
  ["0.24.14", "Functions 90% 구현/검증 정리"],
  ["0.24.15", "WAFL Productization Audit"],
  ["0.24.16", "Codex/GPT 제품화 운영 문맥 구축"],
  ["0.24.17", "소스 리팩터링 1차"],
  ["0.24.18", "제품화 기준 문서 확정"],
  ["0.24.19", "PDF/R2 정책 및 PDF 생성 구조"],
  ["0.24.20", "Release Engineering 및 QA 기준"],
  ["0.24.21", "PB Breakdown 및 Codex Ready Queue"],
];

for (const [version, title] of rearrangedRoadmap) {
  const roadmapFile = fs.readFileSync(`lib/internal/roadmap/roadmap-${version}.ts`, "utf8");
  assert.ok(index.includes(`ROADMAP_${version.replace(/\./g, "_")}`), `index missing ${version} import or registration`);
  assert.ok(roadmapFile.includes(`version: "${version}"`), `roadmap ${version} missing version`);
  assert.ok(roadmapFile.includes(title), `roadmap ${version} missing title ${title}`);
  assert.ok(roadmapDoc.includes(`\`${version}\``), `roadmap doc missing ${version}`);
  assert.ok(roadmapDoc.includes(title), `roadmap doc missing ${title}`);
}

assert.ok(roadmapDoc.includes("기존 기능 계획을 취소하지 않고 재배치"), "roadmap doc must explain rearrangement policy");
assert.ok(roadmapDoc.includes("Vercel 배포본은 운영이 아니라 실기기 QA 환경"), "roadmap doc must clarify Vercel QA policy");

const nextRoadmap = fs.readFileSync("lib/internal/roadmap/roadmap-0.24.22.ts", "utf8");
for (const token of [
  'version: "0.24.22"',
  "DB Foundation and Authority Alignment",
  "source of truth",
  "RLS",
  "reconciliation",
  "dry-run",
  "rollback",
  "production DB destructive mutation",
  "migrationRequired: false",
]) {
  assert.ok(nextRoadmap.includes(token), `0.24.22 roadmap missing ${token}`);
}
assert.ok(index.includes("ROADMAP_0_24_22"), "index missing 0.24.22 registration");

for (const completionToken of ["구현 완료", "실제 verify-safe PASS", "commit hash 존재", "git push origin master 완료", "사용자 확인 완료"]) {
  assert.ok(draft.includes(completionToken), `completion policy missing ${completionToken}`);
}

for (const pipelineToken of [
  "[switch]$SkipHandoff",
  "-CreateLocalRepoHandoff",
  "-VerificationResultPath",
  "-VerificationProfile",
  "NewLocalRepoBuildResultFile",
  "PublishLocalRepoHandoffNewestSet",
  "build-result-$safeVersion-$timestamp",
  "$newestFiles.Count -ne 2",
  "repo-state-$safeVersion-$timestamp",
  "peacebypiece-ui-$version",
  "ZIP Size Bytes:",
  "Verification Result Path:",
  "Build Result:",
  "Mutation Audit Finding Count:",
  "DB Migration Applied:",
  "DB Schema Mutation:",
  "Business Data Mutation:",
  "R2 Mutation:",
  "Production Migration:",
  "4. Newest",
]) {
  assert.ok(`${workflow}\n${pipeline}\n${readme}`.includes(pipelineToken), `handoff contract missing ${pipelineToken}`);
}

assert.match(workflow, /Finish/);
assert.match(workflow, /SkipHandoff/);
assert.doesNotMatch(workflow, /Invoke-Expression|git add \.|git add -A|git commit -am|git reset|git clean|git checkout|npm install|npm ci/);

console.log("roadmap development contract passed");

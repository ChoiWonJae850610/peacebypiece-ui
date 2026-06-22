import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_21_6: RoadmapVersionDetail = {
  version: "0.24.21.6",
  title: "Repository Cleanup Foundation",
  status: "verification_pending",
  userSummary: [
    "전체 소스 ZIP의 생성 산출물 제외 계약을 보강하고 repository cleanup의 안전 경계를 확정한다.",
  ],
  visibleChanges: [
    "앱 UI는 바뀌지 않으며 handoff ZIP에서 reports와 tsbuildinfo 등 생성물이 제외되도록 검사한다.",
  ],
  expectedUi: ["사용자 화면 변화 없음"],
  developmentPurpose: [
    "Codex 대규모 cleanup 전에 저위험 handoff 정리와 삭제 금지 경계를 먼저 고정한다.",
  ],
  developmentUiStructure: ["UI 구조 변경 없음"],
  scope: [
    "handoff ZIP exclude contract",
    "repository cleanup classification",
    "Korean path no-rename policy",
    "docs/package-manager/large-file cleanup boundary",
  ],
  outOfScope: [
    "대량 파일 삭제·이동",
    "대형 컴포넌트 분해",
    "lockfile 삭제",
    "DB/R2/production mutation",
  ],
  implementationPrinciples: [
    "증거가 명확한 생성 산출물만 제외한다.",
    "GitHub에서 정상인 한글 경로는 변경하지 않는다.",
    "orphan 판단은 import graph와 build/test 전에는 확정하지 않는다.",
  ],
  successConditions: [
    "reports와 tsbuildinfo가 후보 필터와 ZIP contract에서 차단된다.",
    "기존 artifacts/playwright/test-results/.wrangler 제외가 유지된다.",
    "pipeline contract test가 새 토큰을 검증한다.",
  ],
  failureConditions: [
    "정상 한글 경로 rename",
    "lockfile 또는 package 변경",
    "근거 없는 dead-file 삭제",
    "runtime 기능 변경",
  ],
  cautions: [
    "업로드 ZIP에 생성물이 포함된 원인은 로컬 실행 경로와 실제 script version을 적용 후 재검증해야 한다.",
  ],
  stopConditions: [
    "handoff가 canonical pipeline 이외 경로에서 생성됨",
    "tracked generated output이 발견됨",
    "package manager 결정이 필요함",
  ],
  permissionImpact: "none",
  permissionNotes: ["권한 코드 변경 없음"],
  dbImpact: "none",
  dbImpactNotes: ["DB 접근·변경 없음"],
  r2Impact: "none",
  r2ImpactNotes: ["R2 접근·변경 없음"],
  migrationRequired: false,
  migrationNotes: "DB Migration 없음",
  automaticTests: [
    "pipeline-repo-state-publication-contract",
    "roadmap-development-contract",
    "handoff ZIP contract",
  ],
  manualTests: [
    "menu 7 handoff ZIP에 artifacts/playwright-report/test-results/reports/tsbuildinfo가 없는지 확인",
    "repo-state Exclude Rule Summary 확인",
    "GitHub 한글 경로 무변경 확인",
  ],
  expectedChangeAreas: [
    "tools/pipeline/peacebypiece-auto-pipeline.ps1",
    "tests/pipeline-repo-state-publication-contract.mjs",
    "docs/project/24-repository-cleanup-foundation.md",
    "lib/internal/roadmap/*",
  ],
  recommendedCommitMessage: "chore: harden repository handoff cleanup contract",
  nextVersionBoundary: [
    "0.24.22에서 Codex Productization Sprint A를 구현하고 repository 대형 리팩터링은 별도 Cleanup Sprint로 관리한다.",
  ],
  completionConditions: [
    "pipeline contract PASS",
    "새 handoff ZIP exclude 검증 PASS",
    "roadmap/version 동기화",
    "commit/push 완료",
  ],
  result: {
    completedSummary: [
      "Repository Cleanup Foundation 문서와 handoff ZIP 생성물 제외 계약을 보강했다.",
    ],
    commitHash: "",
    verificationResult: "수동 패치 생성 완료; 적용 후 pipeline contract와 실제 menu 7 ZIP 확인 필요",
    remainingIssues: [
      "빈 폴더·orphan import graph 감사",
      "문서 archive 재분류",
      "npm/pnpm canonical 결정",
      "대형 파일 Codex 리팩터링",
    ],
    userConfirmationRequired: false,
    userConfirmationResult: "이번 변경은 저위험 pipeline/document 범위다.",
  },
};

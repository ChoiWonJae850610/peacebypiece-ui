import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_21_5: RoadmapVersionDetail = {
  version: "0.24.21.5",
  title: "Codex Productization Sprint Master Pack",
  status: "verification_pending",
  userSummary: [
    "시스템 기본 데이터, 가입·동의·승인, 공개 홈페이지, 저장소·파일 UX, workorder routing, PDF·R2 준비 문서를 Codex 실행 순서로 통합한다.",
  ],
  visibleChanges: [
    "런타임 코드를 변경하지 않고 0.24.22 이후 Codex Sprint의 범위, 선행조건, 검증, 중단, 승인 경계를 확정한다.",
  ],
  expectedUi: [
    "0.24.22 Sprint A에서 관리자/worker WAFL 밀도, Functions 안전 UX, 저장소 원통형, 회사 파일 상태 중복을 우선 구현한다.",
  ],
  developmentPurpose: [
    "Codex 사용량을 작은 단편 작업에 소모하지 않고 의존성과 검증 비용을 고려한 큰 Sprint로 실행한다.",
  ],
  developmentUiStructure: [
    "Sprint A UI Foundation, B Seed/Simulator, C Signup/Consent, D Routing, E Public Website, F PDF/R2로 분리한다.",
  ],
  scope: [
    "Sprint dependency/order",
    "file investigation targets",
    "automatic/manual approval boundary",
    "build/contract/Playwright/Vercel QA sequence",
    "stop/rollback/handoff",
    "blocked decision queue",
  ],
  outOfScope: [
    "React/UI implementation",
    "API/route implementation",
    "DB schema/migration/seed execution",
    "R2/production mutation",
    "public deployment",
    "payment/PDF implementation",
  ],
  implementationPrinciples: [
    "Sprint A만 0.24.22에 구현한다.",
    "미결정 정책은 Blocked Queue에 둔다.",
    "schema나 production mutation이 필요하면 중단한다.",
    "build/test PASS 후 explicit files만 commit/push한다.",
  ],
  successConditions: [
    "0.24.22~후속 Sprint 순서가 명확하다",
    "각 Sprint 범위와 제외 범위가 있다",
    "자동 승인과 수동 승인 경계가 있다",
    "검증·중단·rollback·handoff 기준이 있다",
    "사용자 미결정 항목이 구현 범위에서 분리되어 있다",
  ],
  failureConditions: [
    "여러 Sprint를 한 commit에 혼합",
    "미결정 정책을 임의 값으로 구현",
    "migration/production mutation을 승인 없이 실행",
    "실패한 검증을 무시하고 push",
  ],
  cautions: [
    "workorder public id와 가입 evidence는 조사 결과에 따라 migration Sprint가 필요할 수 있다.",
    "공개 홈페이지는 브랜드·가격·도메인 결정 전 production 공개하지 않는다.",
  ],
  stopConditions: [
    "DB schema/migration 필요",
    "production DB/R2 접근 필요",
    "permission/tenant 정책 변경 필요",
    "package/lockfile 변경 필요",
    "사용자 결정값 필요",
  ],
  permissionImpact: "none",
  permissionNotes: [
    "문서/roadmap만 변경하며 실제 permission code는 변경하지 않는다.",
  ],
  dbImpact: "none",
  dbImpactNotes: [
    "seed/migration/backfill 계획만 통합하며 실행하지 않는다.",
  ],
  r2Impact: "none",
  r2ImpactNotes: [
    "PDF/R2 후속 범위만 정리하며 object mutation은 없다.",
  ],
  migrationRequired: false,
  migrationNotes: "이번 문서 패치는 DB Migration 없음.",
  automaticTests: [
    "TypeScript/build",
    "roadmap-development-contract",
    "문서 경로/version 계약",
    "Flat ZIP 무결성",
  ],
  manualTests: [
    "docs index의 23번 문서 링크",
    "/roadmap 현재 0.24.21.5/다음 0.24.22 표시",
    "Sprint A~F 범위와 중단 경계",
    "Blocked Decision Queue",
    "0.24.22 Sprint A 단독 구현 원칙",
  ],
  expectedChangeAreas: [
    "docs/project/23-codex-productization-sprint-master-pack.md",
    "docs/codex-current-state.md",
    "docs/productization-roadmap.md",
    "lib/constants/version.ts",
    "lib/internal/roadmap/*",
    "pending-tests.md",
  ],
  recommendedCommitMessage:
    "docs: finalize codex productization sprint master pack",
  nextVersionBoundary: [
    "0.24.22에서 Codex가 Sprint A Productization UI Foundation을 실제 구현한다.",
  ],
  completionConditions: [
    "통합 실행 문서 작성",
    "roadmap/version 동기화",
    "required checks PASS",
    "commit/push 완료",
  ],
  result: {
    completedSummary: [
      "0.24.22 이후 Codex Sprint A~F의 범위, 순서, 검증, 승인, 중단, rollback, handoff 계약을 통합했다.",
    ],
    commitHash: "",
    verificationResult:
      "수동 패치 생성 완료; 적용 후 roadmap-development-contract와 build 확인 필요",
    remainingIssues: [
      "0.24.22 Sprint A 실제 구현",
      "migration 필요성 조사",
      "Blocked Decision Queue 사용자 결정",
    ],
    userConfirmationRequired: false,
    userConfirmationResult:
      "미결정 정책은 구현하지 않고 Blocked Queue에 유지한다.",
  },
};

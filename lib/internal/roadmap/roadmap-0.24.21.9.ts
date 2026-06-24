import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_21_9: RoadmapVersionDetail = {
  version: "0.24.21.9",
  title: "Final Policy Decisions and Master TODO",
  status: "verification_pending",
  userSummary: [
    "가입·결제·보존·로그·작업지시서 URL·PDF·공개 운영 정책을 최신 결정으로 통합하고 전체 미개발 TODO를 한 기준판으로 정리한다.",
  ],
  visibleChanges: ["앱 UI 변화 없음"],
  expectedUi: ["사용자 화면 변화 없음"],
  developmentPurpose: [
    "0.24.22 Codex 구현 전에 충돌하던 provisional 정책을 제거하고 구현 순서와 보류 결정을 고정한다.",
  ],
  developmentUiStructure: ["문서와 roadmap만 변경"],
  scope: [
    "브랜드·도메인·가격·문의 정책",
    "시스템 기본 분류·사이즈 스펙 정책",
    "가입·Trial·결제 실패·해지·삭제 정책",
    "운영 로그·메타데이터·보존기간 정책",
    "작업지시서 opaque URL과 PDF lifecycle",
    "전체 미개발 기능과 제품화 TODO 통합",
  ],
  outOfScope: [
    "React/UI/API 구현",
    "DB schema/migration",
    "PG/R2/production 연결",
    "실제 계정·데이터 삭제",
    "package/lockfile 변경",
  ],
  implementationPrinciples: [
    "docs/project/26-final-policy-decisions-and-master-todo.md를 충돌 정책의 최신 canonical 기준으로 사용한다.",
    "결정 완료 항목과 보류 TODO를 분리한다.",
    "구현 여부는 실제 repository evidence와 검증 결과로만 완료 처리한다.",
  ],
  successConditions: [
    "결정사항이 단일 canonical 문서에 정리됨",
    "기존 productization spec의 충돌 지점이 override 문구로 연결됨",
    "0.24.22 이후 구현 TODO가 dependency 순서로 정리됨",
    "roadmap/document contracts PASS",
  ],
  failureConditions: [
    "미구현 기능을 완료로 표시",
    "사용자 보류 결정을 임의 확정",
    "DB/R2/PG/production mutation 실행",
  ],
  cautions: [
    "법률·세무 보존기간은 공개 전 최신 자문으로 재검토한다.",
    "PG와 production vendor는 사업자등록 후 확정한다.",
  ],
  stopConditions: [
    "정책 충돌을 문서만으로 해소할 수 없음",
    "schema/migration 또는 production 접근 필요",
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
    "document-structure-contract",
    "roadmap-development-contract",
    "unicode-encoding-contract",
  ],
  manualTests: [
    "최종 정책/TODO 문서의 결정사항과 보류항목 검토",
    "0.24.22 Codex Sprint A 진입 범위 확인",
  ],
  expectedChangeAreas: [
    "docs/project/26-final-policy-decisions-and-master-todo.md",
    "docs/codex-current-state.md",
    "docs/productization-backlog.md",
    "docs/productization-roadmap.md",
    "lib/internal/roadmap/*",
  ],
  recommendedCommitMessage: "docs: consolidate final policies and master todo",
  nextVersionBoundary: [
    "0.24.22에서 Codex Productization Sprint A를 구현한다.",
  ],
  completionConditions: [
    "canonical policy/TODO 문서 생성",
    "문서·roadmap contract PASS",
    "commit/push 완료",
  ],
  result: {
    completedSummary: [
      "2026-06-24 사용자 결정사항을 canonical 정책으로 통합했다.",
      "정책 문서와 repository-wide 미개발 항목을 하나의 master TODO로 정리했다.",
    ],
    commitHash: "",
    verificationResult: "Unicode PASS; stale document/roadmap contract와 node_modules 없는 handoff 환경 때문에 전체 검증은 사용자 로컬 재실행 필요",
    remainingIssues: [
      "사업자등록 후 PG 선정",
      "속옷·액세서리 기본 분류 결정",
      "analytics/cookie와 홍보 콘텐츠는 출시 준비 TODO",
    ],
    userConfirmationRequired: false,
    userConfirmationResult: "사용자 정책 결정 반영 완료",
  },
};

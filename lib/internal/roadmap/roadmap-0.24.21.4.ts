import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_21_4: RoadmapVersionDetail = {
  version: "0.24.21.4",
  title: "저장소 UI·회사 파일 필드·Workorder Routing 계약",
  status: "verification_pending",
  userSummary: [
    "저장공간 원통형 시각화, 대표 이미지·사업자등록증 상태 표시, 작업지시서 opaque URL 식별자 기준을 Codex 구현 입력으로 확정한다.",
  ],
  visibleChanges: [
    "사용자 UI나 routing을 직접 변경하지 않고 storage cylinder, file field, workorder route의 canonical 명세와 acceptance criteria를 추가한다.",
  ],
  expectedUi: [
    "저장공간은 원통형 usage visualization을 기본으로 하고 80% 경고와 100% 업로드 제한 상태를 텍스트와 함께 표시한다.",
    "대표 이미지와 사업자등록증은 항목명을 한 번만 표시하고 badge는 등록·검토 상태만 표현한다.",
    "작업지시서 상세 URL은 순차 번호나 page/index query 대신 opaque public identifier를 사용한다.",
  ],
  developmentPurpose: [
    "공개 사이트 캡처와 실제 고객 onboarding 전에 눈에 보이는 UI 중복과 routing 노출 문제를 구현 가능한 계약으로 고정한다.",
  ],
  developmentUiStructure: [
    "storage presentation, company file field, workorder route builder/resolver, permission boundary를 분리한다.",
  ],
  scope: [
    "storage cylinder geometry/state/accessibility",
    "80%/100% quota presentation",
    "representative image and business registration file-field states",
    "opaque workorder identifier and canonical route",
    "refresh/deep-link/back navigation",
    "Codex sprint split and verification matrix",
  ],
  outOfScope: [
    "React/UI implementation",
    "route/API implementation",
    "DB schema/migration/backfill",
    "R2 key or retention change",
    "permission policy change",
    "production mutation",
  ],
  implementationPrinciples: [
    "visual state reuses canonical quota policy.",
    "resource name and state are not duplicated.",
    "opaque identifier never replaces tenant/permission authorization.",
    "schema-changing routing work stops for explicit approval.",
  ],
  successConditions: [
    "storage cylinder contract exists",
    "file-field state vocabulary exists",
    "workorder canonical route and compatibility requirements exist",
    "responsive/accessibility acceptance exists",
    "Codex sprint and stop conditions exist",
  ],
  failureConditions: [
    "sequential id is declared safe without source investigation",
    "route hiding is promised",
    "permission checks are weakened",
    "DB/R2 mutation is included",
    "existing quota/file policy is changed",
  ],
  cautions: [
    "browser URLs cannot be hidden.",
    "public identifiers reduce enumeration but are not authorization.",
    "routing implementation may require a separately approved migration/backfill sprint.",
  ],
  stopConditions: [
    "DB schema or migration required",
    "old links must be broken",
    "tenant/permission policy change required",
    "R2/file lifecycle change required",
    "production data mutation required",
  ],
  permissionImpact: "guarded",
  permissionNotes: [
    "문서 변경만 수행하며 기존 system/customer/workorder permission guard를 유지한다.",
  ],
  dbImpact: "none",
  dbImpactNotes: [
    "이번 문서 패치에는 public-id column, migration, backfill이 없다.",
  ],
  r2Impact: "none",
  r2ImpactNotes: [
    "파일 object key, lifecycle, retention, quota 계산을 변경하지 않는다.",
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
    "docs index의 22번 문서 링크",
    "/roadmap 현재 0.24.21.4/다음 0.24.21.5 표시",
    "80%/100% storage state 문구",
    "file label/status 중복 제거 기준",
    "opaque identifier와 authorization 분리 확인",
  ],
  expectedChangeAreas: [
    "docs/project/22-ui-routing-remediation-spec.md",
    "docs/codex-current-state.md",
    "docs/productization-roadmap.md",
    "lib/constants/version.ts",
    "lib/internal/roadmap/*",
    "pending-tests.md",
  ],
  recommendedCommitMessage:
    "docs: define storage cylinder company file and workorder routing remediation",
  nextVersionBoundary: [
    "0.24.21.5에서 0.24.22 Codex Sprint Master Pack을 통합하고 PB·DB/UI·가입·공개사이트·routing 구현 순서를 확정한다.",
  ],
  completionConditions: [
    "문서 작성",
    "roadmap/version 동기화",
    "required checks PASS",
    "commit/push 완료",
  ],
  result: {
    completedSummary: [
      "저장공간 원통형 usage, 회사 파일 field state, workorder opaque route와 deep-link/navigation 계약을 작성했다.",
    ],
    commitHash: "",
    verificationResult:
      "수동 패치 생성 완료; 적용 후 roadmap-development-contract와 build 확인 필요",
    remainingIssues: [
      "실제 storage/file/routing 코드 구현",
      "public-id schema 필요 여부 조사",
      "old route compatibility 기간 결정",
    ],
    userConfirmationRequired: false,
    userConfirmationResult:
      "이번 단계는 기존 요구사항을 구현 계약으로 정리하며 신규 상업 정책을 확정하지 않는다.",
  },
};

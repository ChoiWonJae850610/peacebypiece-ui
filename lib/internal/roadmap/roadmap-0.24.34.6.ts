import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_6: RoadmapVersionDetail = {
  version: "0.24.34.6",
  title: "System Admin and Customer Workspace Gap Audit",
  status: "completed",
  userSummary: [
    "0.24.35 Export 착수 전에 시스템관리자 화면과 고객사 작업공간 화면의 미완성·보수 항목을 route 단위로 문서화한다.",
    "공장 전달 PDF, 치수 기준정보, 가입 신청 재방문, 고객사 메인 대시보드, system-admin 운영 화면의 잔여 작업을 실제 구현 순서와 연결한다.",
    "이번 버전은 코드 구현이 아니라 GPT 기반 정책·gap audit 문서화 버전이다.",
  ],
  visibleChanges: [
    "새 system-admin route-level gap audit 문서가 추가된다.",
    "새 customer workspace route-level gap audit 문서가 추가된다.",
    "roadmap/current-state/master TODO가 0.24.34.6 감사 문서를 다음 구현 기준으로 참조한다.",
  ],
  expectedUi: [
    "실제 화면 UI는 변경하지 않는다.",
    "향후 구현 대상 UI는 audit 문서에서 route별로 분리해 추적한다.",
  ],
  developmentPurpose: [
    "Codex 사용 재개 전, 큰 작업 범위가 흩어지지 않도록 미개발·보수 항목을 canonical audit로 고정한다.",
    "0.24.34.5 continuation A-E의 구현 지시가 screen gap을 빠뜨리지 않도록 한다.",
  ],
  developmentUiStructure: [
    "System audit: /system, signup applications, companies, billing, storage, standards, audit logs, invites/access checkpoint.",
    "Customer audit: /workspace, workorders, files, storage, subscription, settings/legal, members, partners/materials/orders, stats/history.",
  ],
  scope: [
    "docs/audits/0.24.34.6-system-admin-screen-gap-audit.md 추가",
    "docs/audits/0.24.34.6-customer-workspace-screen-gap-audit.md 추가",
    "docs/codex-current-state.md에 0.24.34.6 감사 기준 연결",
    "docs/productization-roadmap.md에 0.24.34.6 감사 기준 연결",
    "docs/project/26-final-policy-decisions-and-master-todo.md에 route-level gap audit TODO 연결",
    "roadmap index에 0.24.34.6 등록",
  ],
  outOfScope: [
    "실제 PDF 템플릿 구현",
    "작업지시서 런타임 코드 수정",
    "가입 신청 OAuth 재방문 구현",
    "system dashboard UI 변경",
    "DB migration",
    "R2 mutation",
    "Playwright/localhost 실행",
    "commit/push 자동 실행",
    "0.24.35 Export 착수",
  ],
  implementationPrinciples: [
    "감사 문서는 완료 선언이 아니라 구현 대상과 검증 기준이다.",
    "mock/fixture evidence와 live dev/test evidence를 구분한다.",
    "route별 gap은 코드 구현 전 canonical 문서에 먼저 고정한다.",
    "사용자 확인이 필요한 PDF 양식과 dashboard UI는 구현 전 정책을 다시 확인한다.",
  ],
  successConditions: [
    "system-admin route별 미완성/보수 항목이 문서에 존재한다.",
    "customer workspace route별 미완성/보수 항목이 문서에 존재한다.",
    "0.24.34.5 잔여 구현 순서와 연결된다.",
    "0.24.35가 아직 시작되지 않았음이 명시된다.",
  ],
  failureConditions: [
    "문서가 특정 화면의 미완성을 완료로 오해하게 만든다.",
    "0.24.35 Export 구현을 시작한다.",
    "system-admin/customer workspace route 중 핵심 route가 audit에서 누락된다.",
  ],
  cautions: [
    "docs/project/33-* 문서 번호가 이미 중복되어 있으므로 이후 새 project document 번호는 중복을 피한다.",
    "repo-state generator가 APP_VERSION을 잘못 읽는 문제는 다음 Codex 작업에서 보정한다.",
    "정책 문서화 commit은 허용되지만 PDF/화면 구현 결과는 사용자 검수 전 최종 완료 commit/push하지 않는다.",
  ],
  stopConditions: [
    "기준 ZIP과 repo-state가 0.24.34.5 clean baseline이 아닌 경우",
    "기존 canonical 정책과 정면 충돌하는 사용자 결정이 필요한 경우",
  ],
  permissionImpact: "read_only",
  permissionNotes: [
    "문서 감사만 수행한다.",
    "권한 로직은 변경하지 않는다.",
  ],
  dbImpact: "none",
  dbImpactNotes: [
    "DB schema와 데이터는 변경하지 않는다.",
  ],
  r2Impact: "none",
  r2ImpactNotes: [
    "R2 object는 생성·수정·삭제하지 않는다.",
  ],
  migrationRequired: false,
  migrationNotes: "문서 감사 버전이므로 migration 없음.",
  automaticTests: [
    "NOT_RUN - GPT 문서 패치이며 로컬 build/test는 Codex 재개 후 확인한다.",
  ],
  manualTests: [
    "문서 내용 검토",
    "0.24.34.5 continuation A-E 지시문 작성 전 audit coverage 확인",
  ],
  expectedChangeAreas: [
    "docs/audits",
    "docs/codex-current-state.md",
    "docs/productization-roadmap.md",
    "docs/project/26-final-policy-decisions-and-master-todo.md",
    "lib/internal/roadmap",
    "lib/constants/version.ts",
  ],
  futureDependencies: [
    "0.24.34.5 continuation A - PDF 템플릿 교체",
    "0.24.34.5 continuation B - 치수 기준정보와 입력 UI",
    "0.24.34.5 continuation C - 작업지시서 실데이터 재확인",
    "0.24.34.5 continuation D - 가입 신청 재방문",
    "0.24.34.5 continuation E - 대시보드 정리",
    "0.24.35 - Company-wide Export Execution",
  ],
  userDecisionsRequired: [
    "PDF 양식 이미지 검수",
    "customer workspace dashboard compact 배치 검수",
    "system-admin dashboard/list density 검수",
  ],
  recommendedCommitMessage: "0.24.34.6 시스템관리자·고객사 화면 gap audit 문서화",
  nextVersionBoundary: [
    "0.24.34.6은 문서 감사 버전이다.",
    "0.24.35 Export 구현은 시작하지 않는다.",
  ],
  completionConditions: [
    "문서 패치 적용",
    "사용자가 감사 문서 범위를 확인",
    "Codex 재개 시 continuation A-E로 분할 구현",
  ],
  result: {
    completedSummary: [
      "system-admin route-level gap audit 문서 추가",
      "customer workspace route-level gap audit 문서 추가",
      "roadmap/current-state/master TODO에 감사 문서 연결",
    ],
    commitHash: "PENDING_USER_APPLY",
    verificationResult: "DOCUMENT_ONLY_NOT_RUN",
    remainingIssues: [
      "실제 코드 구현 없음",
      "localhost/browser/PDF evidence 없음",
      "0.24.34.5 continuation 구현 필요",
    ],
    userConfirmationRequired: true,
    userConfirmationResult: "PENDING",
  },
};

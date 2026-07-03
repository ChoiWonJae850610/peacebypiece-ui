import type { RoadmapVersionDetail } from "./types";

export const ROADMAP_0_24_34_3_1: RoadmapVersionDetail = {
  version: "0.24.34.3.1",
  title: "Product Completion, Canonical WAFL UI, and Automated Evidence Standard",
  status: "completed",
  userSummary: [
    "제품 UI의 완료 기준을 코드 작성이나 정적 검증이 아니라 실제 localhost 화면과 사용자 요구 일치로 통일한다.",
    "Codex, GPT, 사용자가 같은 증거와 같은 완료 레벨을 사용하도록 canonical 규칙을 저장소에 고정한다.",
  ],
  visibleChanges: [
    "애플리케이션 기능 UI는 변경하지 않으며 APP_VERSION과 내부 roadmap 기준만 0.24.34.3.1로 갱신한다.",
    "후속 UI 작업은 desktop/mobile/iPad 캡처와 locator, console, network 증거 없이는 완료로 표시할 수 없다.",
  ],
  expectedUi: [
    "이번 문서 패치 자체는 고객 화면을 변경하지 않는다.",
    "0.24.34.4부터 실제 화면 위치, WAFL 공통 컴포넌트, 문구, interaction이 모두 검증되어야 한다.",
  ],
  developmentPurpose: [
    "코드 존재, 정적 검증, 런타임 검증, 제품 검증을 네 단계로 분리한다.",
    "공통 모듈이라는 추상 표현을 정확한 canonical import와 금지 패턴으로 바꾼다.",
    "localhost Playwright 자동 캡처와 evidence manifest를 UI 완료 조건으로 만든다.",
  ],
  developmentUiStructure: [
    "Canonical modal은 components/common/ui/WaflModal.tsx 또는 기존 shared modal shell을 사용한다.",
    "Button, number input, select, selectable card, admin data table도 문서에 지정한 WAFL import를 우선 사용한다.",
    "화면 배치는 host component, section order, forbidden duplicate 위치로 기술하고 locator로 증명한다.",
  ],
  scope: [
    "AGENTS.md에 LEVEL_4 product completion 규칙 추가.",
    "docs/project/32-product-completion-and-ui-evidence-standard.md 추가.",
    "canonical WAFL component registry, localhost screenshot evidence, auth secret, Full Reset evidence 규칙 확정.",
    "0.24.34.4의 workorder loading, right-side size panel, WAFL modal, signup E2E 범위 고정.",
    "APP_VERSION, current-state, productization roadmap, runtime roadmap index 동기화.",
    "문서/roadmap 정합성 contract 추가.",
  ],
  outOfScope: [
    "작업지시서 로딩 오류의 실제 코드 수정.",
    "치수 컴포넌트의 실제 이동 또는 모달 교체.",
    "가입 신청 browser E2E 실행.",
    "0.24.35 Company-wide Export Execution.",
    "DB/R2/Worker/production mutation.",
  ],
  implementationPrinciples: [
    "UI는 LEVEL_4_PRODUCT_VERIFIED만 완료로 보고한다.",
    "정적 PASS는 제품 완료의 대체 증거가 아니다.",
    "공통 WAFL 컴포넌트는 정확한 import와 사용 증거로 판정한다.",
    "인증정보는 gitignored local input 또는 storageState로만 제공한다.",
    "Full Reset은 원인 증거와 사용자 승인 없이는 실행하거나 권장하지 않는다.",
  ],
  successConditions: [
    "완료 단계, 증거 matrix, canonical import, 자동 캡처, secret, reset 규칙이 canonical 문서에 존재한다.",
    "0.24.34.4가 0.24.35보다 먼저 수행되는 mandatory product verification patch로 등록된다.",
    "문서/roadmap contract가 version과 필수 규칙을 검증한다.",
  ],
  failureConditions: [
    "문서가 UI 완료를 build/contract PASS만으로 허용한다.",
    "credentials를 source/Git/ZIP에 저장하도록 허용한다.",
    "0.24.34.4 검증 전에 0.24.35를 시작하도록 표시한다.",
  ],
  cautions: [
    "이번 버전은 정책·문서 패치이므로 실제 UI 문제를 해결했다고 보고하지 않는다.",
    "실제 canonical import 경로가 변경되면 이 문서와 UI catalog를 함께 갱신한다.",
  ],
  stopConditions: [
    "기존 final owner policy와 충돌하는 완료 기준이 발견됨.",
    "문서 패치 범위를 넘어 실제 runtime/source UI 수정이 필요함.",
  ],
  permissionImpact: "none",
  permissionNotes: ["권한 모델 변경 없음"],
  dbImpact: "none",
  dbImpactNotes: ["DB Migration 및 DB mutation 없음"],
  r2Impact: "none",
  r2ImpactNotes: ["R2 mutation 없음"],
  migrationRequired: false,
  migrationNotes: "DB Migration 없음",
  automaticTests: [
    "product-completion-ui-evidence-standard-contract",
    "roadmap 0.24.34.3.1 contract",
    "git diff --check",
  ],
  manualTests: ["없음 — 실제 localhost UI evidence는 0.24.34.4에서 필수"],
  expectedChangeAreas: [
    "AGENTS.md",
    "docs/project/32-product-completion-and-ui-evidence-standard.md",
    "docs/codex-current-state.md",
    "docs/productization-roadmap.md",
    "lib/constants/version.ts",
    "lib/internal/roadmap/*",
    "tests/*",
  ],
  recommendedCommitMessage: "0.24.34.3.1 제품 완료 기준과 UI 증거 규칙 확정",
  nextVersionBoundary: [
    "0.24.34.4에서 작업지시서 로딩 복구, 치수 우측 배치, WAFL 모달, 가입 제출 E2E, localhost 자동 캡처를 LEVEL_4로 완료한다.",
    "0.24.35 Company-wide Export는 0.24.34.4 mandatory evidence 완료 후 시작한다.",
  ],
  completionConditions: [
    "canonical 문서와 AGENTS 규칙 반영",
    "APP_VERSION/roadmap/current-state 정렬",
    "정적 contract PASS",
    "flat patch ZIP과 commit-meta.md 제공",
  ],
  result: {
    completedSummary: [
      "제품 완료 레벨, WAFL canonical import, localhost 자동 캡처, 로그인 secret, Full Reset 증거 규칙을 저장소 기준으로 확정했다.",
    ],
    commitHash: "pending user patch application",
    verificationResult: "GPT document-rule patch static contracts PASS",
    remainingIssues: [
      "0.24.34.4 실제 runtime/UI/E2E 구현 및 LEVEL_4 증거는 Codex 후속 작업이다.",
    ],
    userConfirmationRequired: false,
    userConfirmationResult: "사용자가 GPT 문서 규칙 패치 진행을 명시적으로 요청했다.",
  },
};

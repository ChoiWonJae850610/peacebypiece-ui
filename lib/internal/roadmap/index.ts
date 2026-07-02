import { APP_VERSION } from "@/lib/constants/version";

import { ROADMAP_0_24_12 } from "./roadmap-0.24.12";
import { ROADMAP_0_24_13 } from "./roadmap-0.24.13";
import { ROADMAP_0_24_14 } from "./roadmap-0.24.14";
import { ROADMAP_0_24_15 } from "./roadmap-0.24.15";
import { ROADMAP_0_24_16 } from "./roadmap-0.24.16";
import { ROADMAP_0_24_17 } from "./roadmap-0.24.17";
import { ROADMAP_0_24_18 } from "./roadmap-0.24.18";
import { ROADMAP_0_24_19 } from "./roadmap-0.24.19";
import { ROADMAP_0_24_20 } from "./roadmap-0.24.20";
import { ROADMAP_0_24_21 } from "./roadmap-0.24.21";
import { ROADMAP_0_24_21_1 } from "./roadmap-0.24.21.1";
import { ROADMAP_0_24_21_2 } from "./roadmap-0.24.21.2";
import { ROADMAP_0_24_21_3 } from "./roadmap-0.24.21.3";
import { ROADMAP_0_24_21_4 } from "./roadmap-0.24.21.4";
import { ROADMAP_0_24_21_5 } from "./roadmap-0.24.21.5";
import { ROADMAP_0_24_21_6 } from "./roadmap-0.24.21.6";
import { ROADMAP_0_24_21_7 } from "./roadmap-0.24.21.7";
import { ROADMAP_0_24_21_8 } from "./roadmap-0.24.21.8";
import { ROADMAP_0_24_21_9 } from "./roadmap-0.24.21.9";
import { ROADMAP_0_24_21_10 } from "./roadmap-0.24.21.10";
import { ROADMAP_0_24_21_11 } from "./roadmap-0.24.21.11";
import { ROADMAP_0_24_21_12 } from "./roadmap-0.24.21.12";
import { ROADMAP_0_24_21_13 } from "./roadmap-0.24.21.13";
import { ROADMAP_0_24_21_14 } from "./roadmap-0.24.21.14";
import { ROADMAP_0_24_21_15 } from "./roadmap-0.24.21.15";
import { ROADMAP_0_24_21_16 } from "./roadmap-0.24.21.16";
import { ROADMAP_0_24_21_17 } from "./roadmap-0.24.21.17";
import { ROADMAP_0_24_21_18 } from "./roadmap-0.24.21.18";
import { ROADMAP_0_24_21_19 } from "./roadmap-0.24.21.19";
import { ROADMAP_0_24_22 } from "./roadmap-0.24.22";
import { ROADMAP_0_24_23 } from "./roadmap-0.24.23";
import { ROADMAP_0_24_24 } from "./roadmap-0.24.24";
import { ROADMAP_0_24_24_1 } from "./roadmap-0.24.24.1";
import { ROADMAP_0_24_25 } from "./roadmap-0.24.25";
import { ROADMAP_0_24_25_1 } from "./roadmap-0.24.25.1";
import { ROADMAP_0_24_25_2 } from "./roadmap-0.24.25.2";
import { ROADMAP_0_24_25_3 } from "./roadmap-0.24.25.3";
import { ROADMAP_0_24_25_4 } from "./roadmap-0.24.25.4";
import { ROADMAP_0_24_26 } from "./roadmap-0.24.26";
import { ROADMAP_0_24_27 } from "./roadmap-0.24.27";
import { ROADMAP_0_24_28 } from "./roadmap-0.24.28";
import { ROADMAP_0_24_29 } from "./roadmap-0.24.29";
import { ROADMAP_0_24_30 } from "./roadmap-0.24.30";
import { ROADMAP_0_24_31 } from "./roadmap-0.24.31";
import { ROADMAP_0_24_32 } from "./roadmap-0.24.32";
import { ROADMAP_0_24_33 } from "./roadmap-0.24.33";
import type { ProductizationRoadmapSummary, RoadmapImpact, RoadmapStatus, RoadmapVersionDetail } from "./types";

export type { ProductizationRoadmapSummary, RoadmapImpact, RoadmapResult, RoadmapStatus, RoadmapVersionDetail } from "./types";

export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  planned: "예정",
  in_progress: "진행 중",
  implemented: "구현 완료",
  verification_pending: "검증 대기",
  user_test_needed: "사용자 확인 필요",
  user_decision_needed: "사용자 결정 필요",
  completed: "완료",
  paused: "보류",
  canceled: "취소",
};

export const ROADMAP_IMPACT_LABELS: Record<RoadmapImpact, string> = {
  none: "영향 없음",
  read_only: "기존 읽기/동작 유지",
  guarded: "기존 guard 유지",
  pending_decision: "사용자 결정 필요",
};

const completedResult = (commits: string[], verificationResult: string): RoadmapVersionDetail["result"] => ({
  completedSummary: ["구현, 검증, commit, push가 완료된 기준 항목이다."],
  commitHash: commits.join(", "),
  verificationResult,
  remainingIssues: [],
  userConfirmationRequired: false,
  userConfirmationResult: "자동 검증으로 충분한 범위",
});

const ROADMAP_0_24_10: RoadmapVersionDetail = {
  version: "0.24.10",
  title: "시스템 관리자 저장공간과 자동화 기반",
  status: "completed",
  userSummary: [
    "시스템 관리자가 회사별 저장공간 사용량을 DB 기준으로 확인할 수 있게 했다.",
    "Codex가 검증, commit, push를 더 안전하게 진행할 수 있는 PowerShell wrapper를 마련했다.",
  ],
  visibleChanges: [
    "/system/storage-usage가 attachment/trash metadata를 기준으로 저장공간을 집계한다.",
    "PowerShell 메뉴에서 전체 프로젝트 ZIP과 repo-state 전달본을 만들 수 있다.",
  ],
  expectedUi: ["시스템 관리자 저장공간 화면은 조회 중심으로 유지한다.", "일반 사용자 업무 화면은 이 버전에서 바꾸지 않았다."],
  developmentPurpose: ["DB-backed storage usage evidence와 안전한 버전 완료 자동화의 기반을 만든다."],
  developmentUiStructure: ["시스템 storage usage API와 관리자 화면을 기존 system shell 안에서 유지한다."],
  scope: ["storage_usage_snapshots write path 연결", "verify-safe.ps1", "finish-version.ps1", "local repo handoff ZIP/repo-state"],
  outOfScope: ["일반 사용자 workspace UI 변경", "PDF/R2 정책 확정"],
  implementationPrinciples: ["production 접근 없이 dev/test 계약과 repository contract로 검증한다."],
  successConditions: ["Build PASS", "Mutation Audit high-risk 0", "system storage contract PASS"],
  failureConditions: ["DB/R2 production 접근", "package/lockfile 변경", "migration 변경"],
  cautions: ["storage snapshot write는 기존 API 정책 안에서만 사용한다."],
  stopConditions: ["production DB/R2 접근 필요", "schema 변경 필요"],
  permissionImpact: "guarded",
  permissionNotes: ["system administrator guard 유지"],
  dbImpact: "guarded",
  dbImpactNotes: ["DB metadata read와 snapshot insert path가 존재하나 이번 roadmap 화면은 write하지 않는다."],
  r2Impact: "read_only",
  r2ImpactNotes: ["R2 reconciliation은 후속 productization 과제로 남았다."],
  migrationRequired: false,
  migrationNotes: "DB Migration 없음",
  automaticTests: ["Build", "Mutation Audit", "system-storage-usage-real-data-contract"],
  manualTests: ["시스템 관리자 저장공간 화면 확인"],
  expectedChangeAreas: ["lib/billing/storageUsageRepository.ts", "tools/pipeline/*", "tests/*"],
  recommendedCommitMessage: "feat: add system storage usage automation foundation",
  nextVersionBoundary: ["0.24.11에서 id-control과 roadmap 조회 화면을 정리한다."],
  completionConditions: ["구현 완료", "verify-safe PASS", "commit hash 존재", "push 완료"],
  result: completedResult(
    ["a4c1921d86e68de27e282150b4195cff27d76d0c", "644e8825dafaf38ca0c736eed6c4efcc33fe38d5"],
    "system-admin-storage PASS",
  ),
};

const ROADMAP_0_24_11: RoadmapVersionDetail = {
  version: "0.24.11",
  title: "시스템 관리자 ID 제어와 roadmap 기준판",
  status: "completed",
  userSummary: [
    "/id-control에서 dev/test 계정 전환과 원래 세션 복원을 더 명확히 본다.",
    "/roadmap에서 버전별 작업 계획과 검증 상태를 시스템 관리자가 조회한다.",
  ],
  visibleChanges: [
    "/dev/test-console은 guard 통과 후 /id-control로 이동한다.",
    "/roadmap은 시스템 관리자 전용이며 편집, 저장, 삭제 기능 없이 버전 계획을 보여준다.",
  ],
  expectedUi: [
    "/roadmap은 한글 표시를 기본으로 하고 현재 앱 버전, 개발 진척도, 제품화 진척도를 보여준다.",
    "각 버전은 요약과 상세 개발 기준을 함께 제공한다.",
  ],
  developmentPurpose: ["0.24.12 일반 사용자 기능 개발 전에 Codex와 사용자가 같은 개발 기준판을 보게 한다."],
  developmentUiStructure: ["system-admin guard가 있는 read-only Next.js server page", "canonical roadmap data facade"],
  scope: ["/id-control", "/dev/test-console redirect", "/roadmap", "roadmap data/doc sync", "verification fingerprint reuse", "system-admin internal read-only routes runtime-independent access"],
  outOfScope: ["일반 사용자 기능 구현", "roadmap 편집 UI", "DB/R2 write"],
  implementationPrinciples: ["조회 전용", "한글 표시", "기존 system-admin guard 유지"],
  successConditions: ["route guard contract PASS", "roadmap Korean label contract PASS", "read-only contract PASS"],
  failureConditions: ["편집/저장 action 추가", "DB/R2 write 추가", "production guard 약화"],
  cautions: ["실제 Google 로그인과 계정 전환은 일부 수동 확인이 남는다."],
  stopConditions: ["권한 정책 변경 필요", "production 접근 필요"],
  permissionImpact: "guarded",
  permissionNotes: ["active system administrator만 접근한다."],
  dbImpact: "none",
  dbImpactNotes: ["roadmap 화면 자체는 DB를 읽거나 쓰지 않는다."],
  r2Impact: "none",
  r2ImpactNotes: ["R2 영향 없음"],
  migrationRequired: false,
  migrationNotes: "DB Migration 없음",
  automaticTests: ["id-control-roadmap", "roadmap-development-contract", "system-admin-internal-access"],
  manualTests: ["system administrator로 /roadmap 접근", "일반 사용자 접근 차단"],
  expectedChangeAreas: ["app/roadmap/page.tsx", "lib/internal/roadmap/*", "docs/productization-roadmap.md", "tools/pipeline/*"],
  recommendedCommitMessage: "feat: expand roadmap into development contract",
  nextVersionBoundary: ["0.24.12부터 일반 사용자 workspace/worker 기능 구현을 시작한다."],
  completionConditions: ["구현 완료", "verify-safe PASS", "commit hash 존재", "push 완료", "4. newest 산출물 생성"],
  result: {
    completedSummary: ["시스템 관리자 ID 제어와 roadmap 기준판, handoff 자동 생성 기반을 구축했다."],
    commitHash: "historical commits recorded in repository history",
    verificationResult: "후속 버전에서 roadmap 및 system-admin contract 검증 완료",
    remainingIssues: [],
    userConfirmationRequired: false,
    userConfirmationResult: "이번 작업은 개발 인프라 구축이며 사용자 수동 UI 판단이 완료 조건은 아니다.",
  },
};

export const PRODUCTIZATION_ROADMAP: ProductizationRoadmapSummary = {
  appVersion: APP_VERSION,
  featureProgressPercent: 96,
  productizationProgressPercent: 91,
  currentWorkVersion: "0.24.33",
  nextWorkVersion: "0.24.34",
  canonicalPolicy:
    "새 버전 작업 전에는 해당 lib/internal/roadmap canonical 상세와 docs/codex-current-state.md를 읽는다. 현재 제품화 실행 순서의 단일 authority는 docs/project/31-pre-codex-integrated-master-plan.md이며, GO/STOP gate는 docs/project/32-pre-codex-authority-consistency-gate.md다. 과거 PB·UI-first 계획은 historical reference로만 사용한다. /roadmap은 조회 전용이며 편집·추가·삭제·저장 기능을 제공하지 않는다.",
  statusLabels: ROADMAP_STATUS_LABELS,
  impactLabels: ROADMAP_IMPACT_LABELS,
  versions: [
    ROADMAP_0_24_10,
    ROADMAP_0_24_11,
    ROADMAP_0_24_12,
    ROADMAP_0_24_13,
    ROADMAP_0_24_14,
    ROADMAP_0_24_15,
    ROADMAP_0_24_16,
    ROADMAP_0_24_17,
    ROADMAP_0_24_18,
    ROADMAP_0_24_19,
    ROADMAP_0_24_20,
    ROADMAP_0_24_21,
    ROADMAP_0_24_21_1,
    ROADMAP_0_24_21_2,
    ROADMAP_0_24_21_3,
    ROADMAP_0_24_21_4,
    ROADMAP_0_24_21_5,
    ROADMAP_0_24_21_6,
    ROADMAP_0_24_21_7,
    ROADMAP_0_24_21_8,
    ROADMAP_0_24_21_9,
    ROADMAP_0_24_21_10,
    ROADMAP_0_24_21_11,
    ROADMAP_0_24_21_12,
    ROADMAP_0_24_21_13,
    ROADMAP_0_24_21_14,
    ROADMAP_0_24_21_15,
    ROADMAP_0_24_21_16,
    ROADMAP_0_24_21_17,
    ROADMAP_0_24_21_18,
    ROADMAP_0_24_21_19,
    ROADMAP_0_24_22,
    ROADMAP_0_24_23,
    ROADMAP_0_24_24,
    ROADMAP_0_24_24_1,
    ROADMAP_0_24_25,
    ROADMAP_0_24_25_1,
    ROADMAP_0_24_25_2,
    ROADMAP_0_24_25_3,
    ROADMAP_0_24_25_4,
    ROADMAP_0_24_26,
    ROADMAP_0_24_27,
    ROADMAP_0_24_28,
    ROADMAP_0_24_29,
    ROADMAP_0_24_30,
  ROADMAP_0_24_31,
  ROADMAP_0_24_32,
  ROADMAP_0_24_33,
  ],
};

export function getRoadmapVersionAnchor(version: string) {
  return `v-${version.replace(/\./g, "-")}`;
}

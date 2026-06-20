import { APP_VERSION } from "@/lib/constants/version";

export type ProductizationRoadmapStatus =
  | "completed"
  | "in_progress"
  | "planned"
  | "verification_pending"
  | "user_test_needed"
  | "user_decision_needed"
  | "paused";

export type ProductizationRoadmapImpact = "none" | "read_only" | "guarded" | "pending_decision";

export type ProductizationRoadmapVersion = {
  version: string;
  title: string;
  status: ProductizationRoadmapStatus;
  scope: string;
  completion: string;
  dbMigration: boolean;
  permissionImpact: ProductizationRoadmapImpact;
  r2Impact: ProductizationRoadmapImpact;
  automaticTests: string[];
  manualTests: string[];
  completedCommit: string | null;
  notes: string;
};

export type ProductizationRoadmapSummary = {
  appVersion: string;
  featureProgressPercent: number;
  productizationProgressPercent: number;
  currentWorkVersion: string;
  canonicalPolicy: string;
  statusLabels: Record<ProductizationRoadmapStatus, string>;
  versions: ProductizationRoadmapVersion[];
};

export const PRODUCTIZATION_ROADMAP: ProductizationRoadmapSummary = {
  appVersion: APP_VERSION,
  featureProgressPercent: 93,
  productizationProgressPercent: 78,
  currentWorkVersion: "0.24.10",
  canonicalPolicy:
    "화면 데이터와 docs/productization-roadmap.md는 함께 갱신한다. Markdown 문서는 사람용 기준 문서이고, /roadmap은 이 구조화 데이터를 조회 전용으로 표시한다.",
  statusLabels: {
    completed: "완료",
    in_progress: "진행 중",
    planned: "예정",
    verification_pending: "검증 대기",
    user_test_needed: "사용자 테스트 필요",
    user_decision_needed: "사용자 결정 필요",
    paused: "보류",
  },
  versions: [
    {
      version: "0.24.07",
      title: "Productization roadmap and inventory",
      status: "completed",
      scope: "제품화 범위와 잔여 작업을 roadmap/audit 문서로 분리",
      completion: "로드맵, inventory audit, current-state, version metadata 정리",
      dbMigration: false,
      permissionImpact: "none",
      r2Impact: "none",
      automaticTests: ["문서/정책 정합성 검토"],
      manualTests: ["제품화 잔여 범위 사용자 확인"],
      completedCommit: null,
      notes: "기능 구현률과 제품화 readiness를 분리해 추적한다.",
    },
    {
      version: "0.24.08",
      title: "Mock/sample/fixture cleanup",
      status: "completed",
      scope: "검증된 미사용 mock/sample source만 제거",
      completion: "정적 참조, build, Mutation Audit, selected contract tests 통과",
      dbMigration: false,
      permissionImpact: "none",
      r2Impact: "none",
      automaticTests: ["npm run build", "npm run audit:wafl-mutations", "selected contract tests"],
      manualTests: ["삭제 후보 재검토"],
      completedCommit: null,
      notes: "dev/test fixture와 lockfile은 유지한다.",
    },
    {
      version: "0.24.09",
      title: "Customer admin plan/storage",
      status: "completed",
      scope: "고객사 관리자 메인에 plan/storage 요약 표시",
      completion: "DB-backed subscription/settings/attachment/trash metadata 연결",
      dbMigration: false,
      permissionImpact: "read_only",
      r2Impact: "read_only",
      automaticTests: ["npm run build", "npm run audit:wafl-mutations", "customer workspace contract"],
      manualTests: ["customer admin /workspace responsive QA"],
      completedCommit: null,
      notes: "R2 reconciliation 표시와 최종 브라우저 QA는 후속으로 남아 있다.",
    },
    {
      version: "0.24.10",
      title: "System admin storage and internal automation",
      status: "in_progress",
      scope: "system storage usage DB metadata 연결, id-control/roadmap 내부 route 정리",
      completion: "system storage API DB-backed, internal route guard/redirect/read-only roadmap 검증",
      dbMigration: false,
      permissionImpact: "guarded",
      r2Impact: "read_only",
      automaticTests: ["verify-safe system-admin-storage", "internal route contract", "Mutation Audit"],
      manualTests: ["system admin /id-control", "system admin /roadmap responsive QA"],
      completedCommit: null,
      notes: "account switch restore와 audit-log browser evidence는 계속 추적한다.",
    },
    {
      version: "0.24.11",
      title: "User workspace screens",
      status: "planned",
      scope: "workorders, material orders, materials, partners, /workspace, /worker policy",
      completion: "responsive layout, save/lock/toast consistency, route denial evidence",
      dbMigration: false,
      permissionImpact: "guarded",
      r2Impact: "pending_decision",
      automaticTests: ["workspace route contracts", "selected E2E/contracts"],
      manualTests: ["PC/tablet/mobile workspace QA"],
      completedCommit: null,
      notes: "이번 작업에서는 시작하지 않는다.",
    },
    {
      version: "0.24.12",
      title: "PDF policy",
      status: "user_decision_needed",
      scope: "workorder and supplier/material-order PDF policy finalization",
      completion: "generation, regeneration, R2 storage, download/print, failure behavior verified",
      dbMigration: false,
      permissionImpact: "guarded",
      r2Impact: "pending_decision",
      automaticTests: ["PDF policy contract", "worker contract"],
      manualTests: ["PDF visual comparison", "download/print QA"],
      completedCommit: null,
      notes: "supplier/material-order PDF output policy needs user decisions.",
    },
    {
      version: "0.24.13",
      title: "Functions, Simulator, PowerShell, automation",
      status: "verification_pending",
      scope: "/functions, simulator dry-run/execute policy, test console, PowerShell menu mapping",
      completion: "dev/test scenarios aligned and destructive paths approval-gated",
      dbMigration: false,
      permissionImpact: "guarded",
      r2Impact: "guarded",
      automaticTests: ["functions contracts", "simulator contracts", "PowerShell parse checks"],
      manualTests: ["guarded execute confirmation review"],
      completedCommit: null,
      notes: "execute modes remain explicit-approval only.",
    },
    {
      version: "0.24.14",
      title: "Productization checkpoint",
      status: "planned",
      scope: "full launch-readiness validation matrix",
      completion: "build/contracts/E2E/manual matrix passed or explicitly deferred",
      dbMigration: false,
      permissionImpact: "guarded",
      r2Impact: "guarded",
      automaticTests: ["full safe validation matrix"],
      manualTests: ["real Google login", "responsive QA", "production-block evidence"],
      completedCommit: null,
      notes: "launch residuals freeze at this checkpoint.",
    },
  ],
};

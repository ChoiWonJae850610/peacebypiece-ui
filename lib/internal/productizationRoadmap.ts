import { APP_VERSION } from "@/lib/constants/version";

export type ProductizationRoadmapStatus =
  | "completed"
  | "in_progress"
  | "planned"
  | "verification_pending"
  | "user_test_needed"
  | "user_decision_needed"
  | "paused"
  | "canceled";

export type ProductizationRoadmapImpact = "none" | "read_only" | "guarded" | "pending_decision";
export type ProductizationRoadmapPriority = "높음" | "중간" | "낮음";

export type ProductizationRoadmapVersion = {
  version: string;
  title: string;
  status: ProductizationRoadmapStatus;
  priority: ProductizationRoadmapPriority;
  relatedScreens: string[];
  workItems: string[];
  dbMigration: boolean;
  dbR2Impact: string;
  permissionImpact: ProductizationRoadmapImpact;
  r2Impact: ProductizationRoadmapImpact;
  automaticTests: string[];
  manualTests: string[];
  completedCommits: string[];
  notes: string;
};

export type ProductizationRoadmapSummary = {
  appVersion: string;
  featureProgressPercent: number;
  productizationProgressPercent: number;
  currentWorkVersion: string;
  nextWorkVersion: string;
  canonicalPolicy: string;
  statusLabels: Record<ProductizationRoadmapStatus, string>;
  versions: ProductizationRoadmapVersion[];
};

export const PRODUCTIZATION_ROADMAP: ProductizationRoadmapSummary = {
  appVersion: APP_VERSION,
  featureProgressPercent: 93,
  productizationProgressPercent: 77,
  currentWorkVersion: "0.24.11",
  nextWorkVersion: "0.24.12",
  canonicalPolicy:
    "사용자가 버전 계획이나 작업 항목을 변경하면 lib/internal/productizationRoadmap.ts와 docs/productization-roadmap.md를 함께 갱신한다. /roadmap은 구조화 데이터를 조회 전용으로 표시하며 화면에서 직접 수정하지 않는다.",
  statusLabels: {
    completed: "완료",
    in_progress: "진행 중",
    planned: "예정",
    verification_pending: "검증 대기",
    user_test_needed: "사용자 테스트 필요",
    user_decision_needed: "사용자 결정 필요",
    paused: "보류",
    canceled: "취소",
  },
  versions: [
    {
      version: "0.24.10",
      title: "시스템 관리자 저장공간과 개발 자동화 기반",
      status: "completed",
      priority: "높음",
      relatedScreens: ["/system/storage-usage", "/system", "PowerShell pipeline"],
      workItems: [
        "시스템 관리자 저장공간 사용량 repository를 DB metadata 기반으로 전환",
        "attachments, attachment_trash_items 집계 연결",
        "storage_usage_snapshots snapshot insert 경로 연결",
        "시스템 관리자 dashboard/billing/storage contract 검증",
        "개발 pipeline 전달본 생성 메뉴 추가",
        "verify-safe.ps1 추가",
        "finish-version.ps1 추가",
        "ZIP/repo-state 전달본 생성 자동화",
        "검증 결과 재사용 및 Git 완료 자동화 기반 마련",
      ],
      dbMigration: false,
      dbR2Impact: "DB/R2 실제 실행 없음",
      permissionImpact: "guarded",
      r2Impact: "read_only",
      automaticTests: [
        "Build PASS",
        "Mutation Audit PASS",
        "Mutation Audit finding 162",
        "Mutation Audit high-risk 0",
        "관련 contract tests PASS",
      ],
      manualTests: ["시스템 관리자 저장공간 화면 확인", "pipeline 전달본 생성 확인"],
      completedCommits: [
        "a4c1921d86e68de27e282150b4195cff27d76d0c",
        "644e8825dafaf38ca0c736eed6c4efcc33fe38d5",
      ],
      notes: "DB Migration 없음. 실제 DB/R2 작업 없음.",
    },
    {
      version: "0.24.11",
      title: "시스템 관리자 ID 제어와 제품화 로드맵",
      status: "in_progress",
      priority: "높음",
      relatedScreens: ["/id-control", "/dev/test-console", "/roadmap"],
      workItems: [
        "기존 /dev/test-console을 /id-control로 이전",
        "/dev/test-console은 /id-control로 호환 redirect",
        "시스템 관리자 전용 접근 유지",
        "현재 impersonated 회사/역할 표시",
        "원래 세션 복원 유지",
        "impersonation audit 유지",
        "/roadmap 신규 시스템 관리자 전용 조회 화면",
        "/roadmap 한글 UI",
        "/roadmap 실제 버전별 작업 데이터 표시",
        "/id-control과 /roadmap 상호 이동 링크",
        "route/guard/read-only contract tests",
        "dev/test account switcher 및 system-admin session 확인",
        "일반 사용자 화면 및 /worker 정리 작업 준비",
        "verify-safe id-control-roadmap 프로필과 verification fingerprint",
      ],
      dbMigration: false,
      dbR2Impact: "로드맵 조회 화면 자체는 write 없음. DB/R2 값 변경 없음.",
      permissionImpact: "guarded",
      r2Impact: "read_only",
      automaticTests: [
        "verify-safe id-control-roadmap",
        "route/guard/redirect/read-only contract",
        "roadmap data rendering contract",
        "roadmap Korean label contract",
      ],
      manualTests: [
        "allowlisted system-admin Google 계정으로 /id-control 확인",
        "allowlisted system-admin Google 계정으로 /roadmap 확인",
        "일반 사용자 접근 차단 확인",
        "모바일/태블릿/PC 반응형 확인",
      ],
      completedCommits: [],
      notes: "권한 의미 변경 없음. 기존 system-admin guard와 production 차단 정책을 유지한다.",
    },
    {
      version: "0.24.12",
      title: "일반 사용자 화면 WAFL 공통화",
      status: "planned",
      priority: "높음",
      relatedScreens: ["/workspace", "/worker", "/workspace/workorders", "/workspace/material-orders"],
      workItems: [
        "일반 사용자 화면 WAFL 공통화",
        "/worker 화면 크기 및 밀도 축소",
        "모바일/태블릿/PC responsive 정리",
        "저장 중 잠금 및 단일 save queue 공통화",
        "발주서/작업지시서 저장·toast·권한 동작 통일",
        "비동기 저장 중 데이터 유실 방지",
      ],
      dbMigration: false,
      dbR2Impact: "정책 결정 전까지 DB/R2 write 확대 없음",
      permissionImpact: "guarded",
      r2Impact: "pending_decision",
      automaticTests: ["workspace route contract", "responsive contract", "save queue contract"],
      manualTests: ["PC/태블릿/모바일 작업지시서와 발주서 QA"],
      completedCommits: [],
      notes: "0.24.11 완료 후 시작한다.",
    },
    {
      version: "0.24.13",
      title: "작업지시서와 발주서 PDF",
      status: "planned",
      priority: "중간",
      relatedScreens: ["/workspace/workorders", "/workspace/material-orders", "PDF Worker", "R2"],
      workItems: [
        "작업지시서 PDF",
        "발주서 PDF",
        "임시 PDF와 최종 R2 저장 정책",
        "Worker와 R2 연계",
        "PDF 생성·재생성·삭제 정책",
        "PDF 자동 검증",
      ],
      dbMigration: false,
      dbR2Impact: "PDF/R2 저장 정책 결정 필요",
      permissionImpact: "guarded",
      r2Impact: "pending_decision",
      automaticTests: ["PDF policy contract", "Worker/R2 adapter contract"],
      manualTests: ["PDF 화면/PDF 파일 비교", "다운로드/인쇄 QA"],
      completedCommits: [],
      notes: "R2 write 정책은 별도 사용자 결정 후 진행한다.",
    },
    {
      version: "0.24.14",
      title: "Functions, Simulator, PowerShell 자동화 정리",
      status: "planned",
      priority: "중간",
      relatedScreens: ["/functions", "/id-control", "Simulator", "PowerShell pipeline"],
      workItems: [
        "/functions",
        "Simulator",
        "/id-control",
        "PowerShell 메뉴",
        "contract/E2E/Smoke/Permissions 연결",
        "테스트 데이터 Seed/Reset/Cleanup 정리",
        "R2 demo create/delete",
        "Playwright report 연결",
        "기능 카탈로그 정리",
      ],
      dbMigration: false,
      dbR2Impact: "Seed/Reset/Cleanup/R2 demo execute는 계속 명시 승인 대상",
      permissionImpact: "guarded",
      r2Impact: "guarded",
      automaticTests: ["functions contract", "simulator contract", "PowerShell parse", "safe wrapper profiles"],
      manualTests: ["destructive confirmation flow review", "Playwright report 확인"],
      completedCommits: [],
      notes: "dry-run과 execute 모드를 명확히 분리한다.",
    },
    {
      version: "0.24.15",
      title: "통합 검증 체크포인트",
      status: "verification_pending",
      priority: "높음",
      relatedScreens: ["전체 앱", "PDF", "DB/R2 integration", "E2E"],
      workItems: [
        "전체 Build",
        "Mutation Audit",
        "contract tests",
        "E2E",
        "Smoke",
        "Permissions",
        "responsive",
        "PDF",
        "DB/R2 integration",
        "수동 통합 테스트",
        "제품화 완료 항목과 잔여 항목 재산정",
      ],
      dbMigration: false,
      dbR2Impact: "통합 검증 중 DB/R2 integration은 별도 승인과 dev/test 대상 확인 필요",
      permissionImpact: "guarded",
      r2Impact: "guarded",
      automaticTests: ["full verify-safe matrix", "E2E", "Smoke", "Permissions"],
      manualTests: ["real Google login", "system-admin/customer-admin/general-user role QA", "제품화 잔여 항목 사용자 확인"],
      completedCommits: [],
      notes: "제품화 완료율을 재산정하는 체크포인트다.",
    },
  ],
};
